#!/usr/bin/env node
/**
 * Pre-Implementation Checker Hook
 *
 * Runs BEFORE Write/Edit tools to ensure:
 * 1. Specifications exist for the feature being implemented
 * 2. Developer understands the requirements
 * 3. Architecture patterns are clear
 *
 * Prevents implementation without proper specs!
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface HookInput {
    session_id: string;
    transcript_path: string;
    cwd: string;
    permission_mode: string;
    tool_name: string;
    tool_input: Record<string, any>;
}

interface Message {
    role: string;
    content: string;
}

interface Transcript {
    messages: Message[];
}

async function main() {
    try {
        const input = readFileSync(0, 'utf-8');
        const data: HookInput = JSON.parse(input);

        // Only run for Write/Edit/NotebookEdit tools on code files
        if (!['Write', 'Edit', 'NotebookEdit'].includes(data.tool_name)) {
            process.exit(0);
        }

        const filePath = data.tool_input.file_path || '';

        // Only check implementation files (not tests, not config, not docs)
        if (!isImplementationFile(filePath)) {
            process.exit(0);
        }

        // Read recent messages to understand context
        const projectDir = process.env.CLAUDE_PROJECT_DIR || data.cwd;
        const transcriptPath = data.transcript_path;

        let context = '';
        if (existsSync(transcriptPath)) {
            const transcript: Transcript = JSON.parse(readFileSync(transcriptPath, 'utf-8'));
            const recentMessages = transcript.messages.slice(-10); // Last 10 messages
            context = recentMessages
                .filter(m => m.role === 'user')
                .map(m => m.content)
                .join(' ')
                .toLowerCase();
        }

        // Check if this looks like implementing a new feature
        const isNewFeature = detectNewFeature(context, filePath);

        if (!isNewFeature) {
            // Just a small edit, not a new feature - allow it
            process.exit(0);
        }

        // Check for specifications
        const specsFound = checkSpecifications(projectDir, context, filePath);

        if (!specsFound.hasAllSpecs) {
            // Missing specs - warn developer
            let output = '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            output += '⚠️ PRE-IMPLEMENTATION CHECK\n';
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
            output += '🔍 Detected: New feature implementation\n';
            output += `📁 File: ${filePath}\n\n`;

            output += '📋 Specification Status:\n';
            if (specsFound.hasApiSpec) {
                output += '  ✅ API Specification found\n';
            } else {
                output += '  ❌ API Specification MISSING\n';
            }

            if (specsFound.hasDbSchema) {
                output += '  ✅ Database Schema found\n';
            } else if (isBackendFile(filePath)) {
                output += '  ⚠️ Database Schema not found (may be needed)\n';
            }

            if (specsFound.hasSprintTask) {
                output += '  ✅ Sprint Task acceptance criteria found\n';
            } else {
                output += '  ⚠️ Sprint Task not detected (using manual implementation)\n';
            }

            if (specsFound.hasArchitectureDoc) {
                output += '  ✅ Architecture documentation found\n';
            } else {
                output += '  ⚠️ Architecture documentation not found\n';
            }

            output += '\n💡 RECOMMENDATIONS:\n\n';

            if (!specsFound.hasApiSpec && isBackendFile(filePath)) {
                output += '  1. Use spec-guardian skill to check for API specs\n';
                output += '     Command: Invoke Skill tool with "spec-guardian"\n\n';
            }

            if (!specsFound.hasSprintTask) {
                output += '  2. Consider creating sprint task for tracking:\n';
                output += '     - Clear acceptance criteria\n';
                output += '     - API endpoint specs\n';
                output += '     - Database requirements\n\n';
            }

            output += '  3. If specs missing, use project-architect agent to create them\n';
            output += '     This ensures consistent, well-documented implementation\n\n';

            output += '⚡ You can proceed, but consider spec-guardian skill first!\n';
            output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

            console.log(output);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error in pre-implementation-checker hook:', err);
        process.exit(0); // Don't block on errors
    }
}

function isImplementationFile(filePath: string): boolean {
    // Implementation files (not tests, not config)
    const implementationPatterns = [
        /\/(controllers|services|repositories|routes|api|endpoints)\//,
        /\/(components|features|pages|screens)\//,
        /\.controller\.(ts|js)$/,
        /\.service\.(ts|js)$/,
        /\.repository\.(ts|js)$/,
        /\.(tsx)$/, // React components
    ];

    const excludePatterns = [
        /\.test\.(ts|tsx|js|jsx)$/,
        /\.spec\.(ts|tsx|js|jsx)$/,
        /\.config\.(ts|js)$/,
        /\.d\.ts$/,
        /\/test\//,
        /\/tests\//,
        /\/config\//,
        /README\.md$/,
        /\.json$/,
    ];

    // Exclude test and config files
    if (excludePatterns.some(pattern => pattern.test(filePath))) {
        return false;
    }

    // Check if it's an implementation file
    return implementationPatterns.some(pattern => pattern.test(filePath));
}

function detectNewFeature(context: string, filePath: string): boolean {
    // Keywords that suggest new feature implementation
    const newFeatureKeywords = [
        'implement',
        'create endpoint',
        'add feature',
        'build',
        'new feature',
        'create api',
        'add route',
        'create service',
        'create controller',
        'new component',
    ];

    // If creating a new file, likely a new feature
    const isNewFile = context.includes('create') || context.includes('new file');

    // If context mentions implementing something
    const mentionsImplementation = newFeatureKeywords.some(keyword =>
        context.includes(keyword)
    );

    return isNewFile || mentionsImplementation;
}

function checkSpecifications(projectDir: string, context: string, filePath: string): {
    hasAllSpecs: boolean;
    hasApiSpec: boolean;
    hasDbSchema: boolean;
    hasSprintTask: boolean;
    hasArchitectureDoc: boolean;
} {
    const result = {
        hasAllSpecs: true,
        hasApiSpec: false,
        hasDbSchema: false,
        hasSprintTask: false,
        hasArchitectureDoc: false,
    };

    // Check for API specification docs
    const apiSpecPaths = [
        join(projectDir, 'projectdoc', '04-API-ENDPOINTS.md'),
        join(projectDir, 'doc', '04-API-ENDPOINTS.md'),
        join(projectDir, 'docs', 'api', 'endpoints.md'),
    ];
    result.hasApiSpec = apiSpecPaths.some(path => existsSync(path));

    // Check for database schema docs
    const dbSchemaPaths = [
        join(projectDir, 'projectdoc', '03-DATABASE-SCHEMA.md'),
        join(projectDir, 'doc', '03-DATABASE-SCHEMA.md'),
        join(projectDir, 'docs', 'database-schema.md'),
    ];
    result.hasDbSchema = dbSchemaPaths.some(path => existsSync(path));

    // Check for sprint tasks (indicates planned feature)
    const sprintPaths = [
        join(projectDir, '.claude', 'sprints'),
        join(projectDir, '.claude', 'TODO'),
    ];
    result.hasSprintTask = sprintPaths.some(path => existsSync(path));

    // Check for architecture documentation
    const archPaths = [
        join(projectDir, 'projectdoc', '01-ARCHITECTUUR.md'),
        join(projectDir, 'doc', '01-ARCHITECTUUR.md'),
        join(projectDir, 'CLAUDE.md'),
    ];
    result.hasArchitectureDoc = archPaths.some(path => existsSync(path));

    // Determine if all required specs are present
    if (isBackendFile(filePath)) {
        // Backend files need API spec and ideally DB schema
        result.hasAllSpecs = result.hasApiSpec;
    } else {
        // Frontend files need less strict checking
        result.hasAllSpecs = result.hasArchitectureDoc;
    }

    return result;
}

function isBackendFile(filePath: string): boolean {
    return /\/(controllers|services|repositories|routes|api)\// .test(filePath) ||
           /\.(controller|service|repository)\.(ts|js)$/.test(filePath);
}

main().catch(err => {
    console.error('Uncaught error:', err);
    process.exit(0); // Don't block on errors
});

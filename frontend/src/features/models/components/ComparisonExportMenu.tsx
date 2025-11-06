import React, { useState } from 'react';
import { Download, Image as ImageIcon, FileText, Link2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useShareComparison } from '../hooks/useModelComparison';
import type { Model } from '../types';

interface ComparisonExportMenuProps {
  models: Model[];
}

export const ComparisonExportMenu: React.FC<ComparisonExportMenuProps> = ({ models }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareComparison = useShareComparison();

  const exportAsPNG = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('comparison-table');
      if (!element) {
        throw new Error('Comparison table not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `model-comparison-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export as PNG:', error);
      alert('Failed to export as PNG. Please try again.');
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('comparison-table');
      if (!element) {
        throw new Error('Comparison table not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`model-comparison-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Failed to export as PDF:', error);
      alert('Failed to export as PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const generateShareLink = async () => {
    try {
      const modelIds = models.map((m) => m.id);
      const result = await shareComparison.mutateAsync(modelIds);

      const fullUrl = `${window.location.origin}/models/compare/shared/${result.id}`;
      setShareUrl(fullUrl);
      setShowShareModal(true);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to generate share link:', error);
      alert('Failed to generate share link. Please try again.');
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  return (
    <>
      <div className="relative">
        <Button
          onClick={() => setShowMenu(!showMenu)}
          variant="outline"
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Exporting...
            </>
          ) : (
            <>
              <Download size={16} className="mr-2" />
              Export
            </>
          )}
        </Button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              <button
                onClick={exportAsPNG}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <ImageIcon size={16} />
                Export as PNG
              </button>
              <button
                onClick={exportAsPDF}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FileText size={16} />
                Export as PDF
              </button>
              <button
                onClick={generateShareLink}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Link2 size={16} />
                Generate Share Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Share Link Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareUrl(null);
          setCopied(false);
        }}
        title="Share Comparison"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Share this comparison with others using the link below:
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl || ''}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            />
            <Button
              onClick={copyToClipboard}
              variant={copied ? 'default' : 'outline'}
              size="sm"
            >
              {copied ? (
                <>
                  <Check size={16} className="mr-1" />
                  Copied!
                </>
              ) : (
                'Copy'
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-500">
            Anyone with this link can view this comparison.
          </p>
        </div>
      </Modal>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
};

export default ComparisonExportMenu;

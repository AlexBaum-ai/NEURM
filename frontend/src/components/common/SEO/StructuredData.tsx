import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  data: object | object[];
}

/**
 * StructuredData Component
 *
 * Renders JSON-LD structured data for SEO
 * Can accept single schema or array of schemas
 *
 * @example
 * ```tsx
 * <StructuredData data={articleSchema} />
 *
 * <StructuredData data={[organizationSchema, articleSchema]} />
 * ```
 */
export const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  const schemas = Array.isArray(data) ? data : [data];

  return (
    <Helmet>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default StructuredData;

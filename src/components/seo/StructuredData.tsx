interface StructuredDataProps {
  data: any | any[]
}

export function StructuredData({ data }: StructuredDataProps) {
  const jsonData = Array.isArray(data) ? data : [data]
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonData.filter(Boolean), null, 2)
      }}
    />
  )
}
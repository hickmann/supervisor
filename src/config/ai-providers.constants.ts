export const AI_PROVIDERS = [
  {
    id: "supervision",
    curl: `curl "https://uwqdksfxzhnmkfqvnloq.supabase.co/functions/v1/analyze-supervision" \\
  -X "POST" \\
  -H "Content-Type: application/json" \\
  -H "apikey: {{API_KEY}}" \\
  -H "authorization: Bearer {{API_KEY}}" \\
  -d '{
    "transcricao": "{{TEXT}}"
  }'`,
    responseContentPath: "avaliacao_tecnica[0].titulo",
    streaming: false,
  },
];

// Chave de API real para o Supabase (chave anon pública)
export const DEFAULT_SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWRrc2Z4emhubWtmcXZubG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4OTU5ODIsImV4cCI6MjA3MzQ3MTk4Mn0.AgKvmWbpN3WODmVEtNz6S-4XZCBR7xoMRfnGqyS-GNQ";
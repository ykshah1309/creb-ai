// pages/edit-lease.tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Box, Spinner, Button } from "@chakra-ui/react";
import { supabase } from "@/lib/supabaseClient";

export default function EditLeasePage() {
  const { query } = useRouter();
  const matchId = query.matchId as string;
  const [loading, setLoading] = useState(true);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (!matchId) return;
    (async () => {
      const { data, error } = await supabase.storage
        .from("leases")
        .download(`${matchId}/lease.pdf`);
      if (error) throw error;
      const buf = await data.arrayBuffer();
      setPdfBytes(new Uint8Array(buf));
      setLoading(false);
    })();
  }, [matchId]);

  const handleSave = async () => {
    if (!pdfBytes) return;
    setLoading(true);
    await supabase.storage
      .from("leases")
      .upload(`${matchId}/lease.pdf`, pdfBytes, { upsert: true });
    setLoading(false);
    alert("Lease updated!");
  };

  if (loading || !pdfBytes) {
    return (
      <Box textAlign="center" mt={20}>
        <Spinner />
      </Box>
    );
  }

  return (
    <Box p={6}>
      <iframe
        src={URL.createObjectURL(
          new Blob([pdfBytes], { type: "application/pdf" })
        )}
        style={{ width: "100%", height: "80vh" }}
      />
      <Button mt={4} colorScheme="teal" onClick={handleSave}>
        Save Changes
      </Button>
    </Box>
  );
}
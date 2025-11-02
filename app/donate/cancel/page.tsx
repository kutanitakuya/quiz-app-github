"use client";

import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function DonateCancelPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, rgba(248,113,113,0.18), rgba(59,130,246,0.12))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            backgroundColor: "white",
            boxShadow: (theme) => theme.shadows[6],
            textAlign: "center",
          }}
        >
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight={700}>
              寄付がキャンセルされました
            </Typography>
            <Typography variant="body1" color="text.secondary">
              手続きはキャンセルされましたが、いつでも再度ご支援いただけます。引き続き QuizLive をお楽しみください。
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
              <Button component={Link} href="/donate" variant="contained">
                寄付ページに戻る
              </Button>
              <Button component={Link} href="/" variant="outlined">
                トップに戻る
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

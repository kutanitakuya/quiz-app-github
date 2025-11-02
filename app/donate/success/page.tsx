"use client";

import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function DonateSuccessPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(59,130,246,0.2))",
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
              ご支援ありがとうございます！
            </Typography>
            <Typography variant="body1" color="text.secondary">
              ご寄付の手続きが完了しました。いただいたご支援は、QuizLive の機能改善やサーバー運用に活用させていただきます。
              引き続きサービスをお楽しみください。
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
              <Button component={Link} href="/host" variant="contained">
                ホストダッシュボードへ
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

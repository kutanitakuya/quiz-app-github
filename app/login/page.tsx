"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/host");
    }
  }, [loading, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/host");
    } catch (err) {
      console.error(err);
      setError("メールアドレスまたはパスワードが正しくありません。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        width="100%"
        p={4}
        borderRadius={2}
        boxShadow={3}
        bgcolor="background.paper"
      >
        <Stack spacing={3}>
          <Typography component="h1" variant="h5" textAlign="center">
            ログイン
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            fullWidth
          />
          <TextField
            label="パスワード"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            size="large"
          >
            {submitting ? <CircularProgress color="inherit" size={24} /> : "ログイン"}
          </Button>
          <Button component={Link} href="/" variant="text">
            ホームに戻る
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}

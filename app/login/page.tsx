"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  Switch,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";
import { FirebaseError } from "firebase/app";
import { auth } from "@/src/lib/firebase";

export default function LoginPage() {
  const {
    login,
    register,
    user,
    loading,
    requestEmailVerification,
    refreshUser,
    sendPasswordReset,
  } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [signupMode, setSignupMode] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!loading && user?.emailVerified) {
      router.replace("/host");
    }
  }, [loading, user, router]);

  const passwordTooShort = useMemo(
    () => password.length > 0 && password.length < 6,
    [password.length]
  );

  const isPasswordMismatch = useMemo(
    () => signupMode && password !== confirmPassword,
    [signupMode, password, confirmPassword]
  );

  const mapAuthError = (err: unknown) => {
    if ((err as Error).message === "PASSWORD_MISMATCH") {
      return "パスワードが一致しません。";
    }
    if (passwordTooShort) {
      return "パスワードは6文字以上で入力してください。";
    }
    if (err instanceof FirebaseError) {
      const code = err.code;
      const messages: Record<string, string> = {
        "auth/weak-password": "パスワードは6文字以上にしてください。",
        "auth/email-already-in-use": "このメールアドレスは既に登録されています。",
        "auth/invalid-email": "メールアドレスの形式が正しくありません。",
        "auth/user-not-found": "アカウントが見つかりません。",
        "auth/wrong-password": "メールアドレスまたはパスワードが正しくありません。",
        "auth/invalid-credential": "メールアドレスまたはパスワードが正しくありません。",
        "auth/too-many-requests": "一定回数以上失敗したため、しばらく時間を置いて再度お試しください。",
      };
      if (messages[code]) return messages[code];
    }
    return signupMode
      ? "アカウントの作成に失敗しました。入力内容を確認してください。"
      : "メールアドレスまたはパスワードが正しくありません。";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setResetting(false);
    setSubmitting(true);
    if (signupMode) {
      if (isPasswordMismatch) {
        setError("パスワードが一致しません。");
        setSubmitting(false);
        return;
      }
      if (passwordTooShort) {
        setError("パスワードは6文字以上で入力してください。");
        setSubmitting(false);
        return;
      }
    }

    try {
      if (signupMode) {
        await register(email, password);
        setInfo("確認用メールを送信しました。メール内のリンクからアドレスを確認してください。（迷惑メールに振り分けられる場合もあります）");
        setSignupMode(false);
      } else {
        await login(email, password);
        router.replace("/host");
      }
    } catch (err) {
      console.error(err);
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) {
      setError("ログイン後に確認メールを再送できます。");
      return;
    }
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await requestEmailVerification();
      setInfo("確認用メールを再送しました。届かない場合は迷惑メールもご確認ください。");
    } catch (err) {
      console.error(err);
      setError(mapAuthError(err));
    } finally {
      setResending(false);
    }
  };

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    setError(null);
    setInfo(null);
    try {
      await refreshUser();
      if (auth.currentUser?.emailVerified) {
        router.replace("/host");
      } else {
        setInfo("まだ確認が完了していません。メール内のリンクを開いた後に再度更新してください。");
      }
    } catch (err) {
      console.error(err);
      setError("状態の更新に失敗しました。時間を置いて再度お試しください。");
    } finally {
      setRefreshing(false);
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
            {signupMode ? "新規登録" : "ログイン"}
          </Typography>
          {!signupMode && user && !user.emailVerified && (
            <Alert severity="warning">
              {user.email ?? "未設定"} の確認が完了していません。確認メールのリンクを開いてからログインしてください。
            </Alert>
          )}
          {info && <Alert severity="success">{info}</Alert>}
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
            error={signupMode && passwordTooShort}
            helperText={
              signupMode && passwordTooShort ? "6文字以上のパスワードを入力してください" : ""
            }
            fullWidth
          />
          {signupMode && (
            <TextField
              label="パスワード（確認用）"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              error={isPasswordMismatch && confirmPassword.length > 0}
              helperText={
                isPasswordMismatch && confirmPassword.length > 0
                  ? "同じパスワードを入力してください"
                  : ""
              }
              fullWidth
            />
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={
              submitting ||
              refreshing ||
              (signupMode && (isPasswordMismatch || passwordTooShort))
            }
            size="large"
          >
            {submitting ? (
              <CircularProgress color="inherit" size={24} />
            ) : signupMode ? (
              "アカウントを作成"
            ) : (
              "ログイン"
            )}
          </Button>
          {!signupMode && (
            <Stack spacing={1}>
              <Button
                variant="outlined"
                onClick={async () => {
                  setError(null);
                  setInfo(null);
                  setResetting(true);
                  try {
                    await sendPasswordReset(email);
                    setInfo("パスワード再設定用のメールを送信しました。受信箱のリンクから手続きを進めてください。");
                  } catch (resetError) {
                    console.error(resetError);
                    setError(mapAuthError(resetError));
                  } finally {
                    setResetting(false);
                  }
                }}
                disabled={resetting || !email}
              >
                {resetting ? "送信中..." : "パスワードをお忘れですか？"}
              </Button>
              {user && !user.emailVerified && (
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={handleResendVerification}
                    disabled={resending}
                  >
                    {resending ? "送信中..." : "確認メールを再送する"}
                  </Button>
                  <Button variant="text" onClick={handleRefreshStatus} disabled={refreshing}>
                    {refreshing ? "再読み込み中..." : "確認状態を再読み込み"}
                  </Button>
                </Stack>
              )}
            </Stack>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={signupMode}
                onChange={(_, checked) => {
                  setSignupMode(checked);
                  setError(null);
                  setInfo(null);
                }}
                color="primary"
              />
            }
            label={signupMode ? "既にアカウントをお持ちの方はこちら" : "アカウントを持っていませんか？新規登録"}
          />
          <Button component={Link} href="/" variant="text">
            ホームに戻る
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}

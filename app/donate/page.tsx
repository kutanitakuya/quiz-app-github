"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const presetAmounts = [500, 1000, 2000]; // 円
const MIN_DONATION = 100;
const MAX_DONATION = 10000;

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export default function DonatePage() {
  const [amount, setAmount] = useState<number>(presetAmounts[0]);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(presetAmounts[0]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const publishableKeyPresent = useMemo(
    () => Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    []
  );

  const effectiveAmount =
    selectedPreset === "custom" ? Number(customAmount) : amount;

  const isAmountInvalid =
    !Number.isFinite(effectiveAmount) ||
    effectiveAmount < MIN_DONATION ||
    effectiveAmount > MAX_DONATION;

  const handlePresetChange = (_: any, value: string) => {
    if (value === "custom") {
      setSelectedPreset("custom");
      setAmount(NaN);
    } else {
      const parsed = Number(value);
      setSelectedPreset(parsed);
      setAmount(parsed);
    }
    setMessage(null);
  };

  const handleCustomChange = (value: string) => {
    setSelectedPreset("custom");
    setCustomAmount(value);
    setMessage(null);
  };

  const handleDonate = async () => {
    if (isAmountInvalid) {
      setMessage(`寄付額は ${MIN_DONATION} 〜 ${MAX_DONATION} 円の範囲で入力してください。`);
      return;
    }
    if (!publishableKeyPresent) {
      setMessage("決済キーが設定されていません。管理者にお問い合わせください。");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(effectiveAmount), currency: "jpy" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "寄付ページの生成に失敗しました。");
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe の初期化に失敗しました。");
      }
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setMessage(err instanceof Error ? err.message : "予期せぬエラーが発生しました。");
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(circle at 80% 0%, rgba(16,185,129,0.16), transparent 60%), radial-gradient(circle at 50% 80%, rgba(236,72,153,0.14), transparent 65%), #0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            borderRadius: 6,
            p: { xs: 4, md: 6 },
            backgroundColor: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 30px 60px -15px rgba(15,23,42,0.65)",
            backdropFilter: "blur(16px)",
            color: "white",
          }}
        >
          <Stack spacing={4}>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                QuizLive に寄付する
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                QuizLive は無料でお使いいただけます。もしこのプロジェクトを気に入っていただけたら、運営の継続と機能開発のために寄付で応援していただけると嬉しいです。
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="rgba(255,255,255,0.75)" gutterBottom>
                寄付額を選択
              </Typography>
              <RadioGroup
                row
                value={selectedPreset === "custom" ? "custom" : amount.toString()}
                onChange={handlePresetChange}
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                {presetAmounts.map((preset) => (
                  <FormControlLabel
                    key={preset}
                    value={preset.toString()}
                    control={<Radio />}
                    label={`¥${preset.toLocaleString()}`}
                    sx={{
                      m: 0,
                      px: 2,
                      borderRadius: "999px",
                      backgroundColor:
                        selectedPreset === preset ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.08)",
                    }}
                  />
                ))}
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label="任意の金額"
                  sx={{
                    m: 0,
                    px: 2,
                    borderRadius: "999px",
                    backgroundColor:
                      selectedPreset === "custom" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.08)",
                  }}
                />
              </RadioGroup>

              <TextField
                sx={{ mt: 2 }}
                label="任意の寄付額（円）"
                type="number"
                fullWidth
                disabled={selectedPreset !== "custom"}
                inputProps={{ min: MIN_DONATION, max: MAX_DONATION }}
                value={selectedPreset === "custom" ? customAmount : ""}
                onChange={(e) => handleCustomChange(e.target.value)}
                color={isAmountInvalid ? "error" : "primary"}
                helperText={
                  selectedPreset === "custom"
                    ? `¥${MIN_DONATION.toLocaleString()} 〜 ¥${MAX_DONATION.toLocaleString()} の範囲で入力してください`
                    : undefined
                }
                InputProps={{
                  sx: {
                    color: "white",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "rgba(255,255,255,0.7)",
                    "&.Mui-focused": { color: "rgba(255,255,255,0.9)" },
                  },
                }}
                FormHelperTextProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
              />
            </Box>

            {message && <Alert severity="warning">{message}</Alert>}

            {!publishableKeyPresent && (
              <Alert severity="error">
                環境変数 <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> が設定されていないため、寄付の受付が行えません。
              </Alert>
            )}

            <Box>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || isAmountInvalid || !publishableKeyPresent}
                onClick={handleDonate}
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: "1rem",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(56,189,248,1) 100%)",
                  boxShadow: "0 20px 30px -15px rgba(59,130,246,0.45)",
                  "&:hover": {
                    background: "linear-gradient(90deg, rgba(37,99,235,1) 0%, rgba(14,165,233,1) 100%)",
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : `${submitLabel(effectiveAmount)}`}
              </Button>
              <Typography variant="caption" display="block" align="center" sx={{ mt: 1, color: "rgba(255,255,255,0.6)" }}>
                Stripe による安全な決済が行われます
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="rgba(255,255,255,0.75)" gutterBottom>
                寄付について
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.6)">
                寄付金はサーバー費用、機能改善、サポート体制の充実に充てられます。領収書は Stripe のメールから発行されます。
              </Typography>
            </Box>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Link href="/" className="text-sm text-white/70 underline-offset-2 hover:underline">
                トップに戻る
              </Link>
              <Link href="/host" className="text-sm text-white/70 underline-offset-2 hover:underline">
                ホストダッシュボードへ
              </Link>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

function submitLabel(amount: number) {
  if (!Number.isFinite(amount)) return "寄付する";
  return `¥${Math.round(amount).toLocaleString()} 寄付する`;
}

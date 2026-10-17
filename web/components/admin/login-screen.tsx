"use client";

import { AlertCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon, LockIcon } from "lucide-react";
import Image from "next/image";
import { useActionState, useState } from "react";
import { login } from "@/app/responses/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginScreen() {
  const [state, formAction, pending] = useActionState(login, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside className="brand-gradient relative flex flex-col justify-between overflow-hidden px-6 py-8 text-white sm:px-10 lg:py-12">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={40} height={40} className="size-10 rounded-full ring-4 ring-white/15" />
          <span className="font-heading text-lg font-semibold">Kotu</span>
        </div>
        <div className="mt-10 max-w-md lg:mt-0">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Every customer voice, in one place.
          </h1>
        </div>
        <p className="mt-10 hidden text-sm text-white/60 lg:block">© Kotu · Admin area</p>
        {/* Decorative rings */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-24 size-80 rounded-full border-40 border-white/5" />
        <div aria-hidden className="pointer-events-none absolute -right-8 -bottom-8 size-40 rounded-full border-24 border-white/5" />
      </aside>

      {/* Form */}
      <main className="flex items-start justify-center bg-background px-4 py-10 sm:px-6 lg:items-center">
        <form
          action={formAction}
          noValidate
          className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-[0_1px_2px_rgb(14_1_147/0.06),0_8px_24px_rgb(14_1_147/0.08)] sm:p-8"
        >
          <span className="mb-5 grid size-11 place-items-center rounded-xl bg-accent text-primary">
            <LockIcon className="size-5" />
          </span>
          <h2 className="font-heading text-2xl font-semibold">Welcome back</h2>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                required
                defaultValue={state.username}
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="h-11 pr-11 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          {state.error && !pending && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircleIcon />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={pending} className="mt-6 h-11 w-full rounded-xl font-heading text-base font-semibold">
            {pending ? (
              <>
                <Loader2Icon className="animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}

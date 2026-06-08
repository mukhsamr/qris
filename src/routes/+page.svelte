<script lang="ts">
  import jsQR from "jsqr";
  import QRCode from "qrcode";
  import Download from "@lucide/svelte/icons/download";
  import Play from "@lucide/svelte/icons/play";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import LoaderCircle from "@lucide/svelte/icons/loader-circle";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import QrCode from "@lucide/svelte/icons/qr-code";

  import Navbar from "$lib/components/ui/Navbar.svelte";
  import FileUpload from "$lib/components/ui/FileUpload.svelte";

  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import * as Card from "$lib/components/ui/card";
  import * as Alert from "$lib/components/ui/alert";
  import * as Collapsible from "$lib/components/ui/collapsible";

  let fileInput = $state<HTMLInputElement>();
  let imagePreview = $state<string | null>(null);
  let qrisPayload = $state<string>("");
  let amount = $state<string>("");
  let generatedPayload = $state<string | null>(null);
  let generatedQRDataURL = $state<string | null>(null);
  let error = $state<string | null>(null);
  let decoding = $state(false);
  let generating = $state(false);
  let decodeError = $state(false);
  let rawOpen = $state(false);

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function processFile(file: File) {
    error = null;
    decodeError = false;
    generatedPayload = null;
    generatedQRDataURL = null;
    qrisPayload = "";

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      imagePreview = dataURL;
      decodeQRFromImage(dataURL);
    };
    reader.readAsDataURL(file);
  }

  function decodeQRFromImage(dataURL: string) {
    decoding = true;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        error = "Gagal memproses gambar";
        decoding = false;
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        qrisPayload = code.data;
        decoding = false;
      } else {
        const code2 = jsQR(imageData.data, imageData.width, imageData.height);
        if (code2) {
          qrisPayload = code2.data;
          decoding = false;
        } else {
          decodeError = true;
          decoding = false;
        }
      }
    };

    img.onerror = () => {
      error = "Gagal memuat gambar";
      decoding = false;
    };

    img.src = dataURL;
  }

  async function handleGenerate() {
    error = null;

    if (!qrisPayload) {
      error = "Upload gambar QRIS terlebih dahulu";
      return;
    }

    const numAmount = parseInt(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      error = "Masukkan nominal transaksi yang valid";
      return;
    }

    generating = true;

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrisPayload,
          amount: numAmount,
        }),
      });

      const data: {
        success: boolean;
        payload?: string;
        error?: string;
      } = await res.json();

      if (!data.success) {
        error = data.error ?? "Gagal generate QRIS";
        generating = false;
        return;
      }

      const payload = data.payload!;
      generatedPayload = payload;

      const url = await QRCode.toDataURL(payload, {
        width: 512,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      generatedQRDataURL = url;
    } catch {
      error = "Gagal menghubungi server. Coba lagi.";
    }

    generating = false;
  }

  function handleDownload() {
    if (!generatedQRDataURL) return;
    const link = document.createElement("a");
    link.href = generatedQRDataURL;
    link.download = `qris-dynamic-${amount}.png`;
    link.click();
  }

  function reset() {
    imagePreview = null;
    qrisPayload = "";
    amount = "";
    generatedPayload = null;
    generatedQRDataURL = null;
    error = null;
    decodeError = false;
    rawOpen = false;
    if (fileInput) fileInput.value = "";
  }
</script>

<svelte:head>
  <title>QRIS Converter — Buat QRIS Dinamis dengan Mudah</title>
</svelte:head>

<div class="flex min-h-dvh flex-col bg-background">
  <Navbar />

  <!-- Hero -->
  <section class="px-6 pt-8 pb-6 text-center lg:pt-12 lg:pb-8">
    <h1
      class="mx-auto max-w-2xl text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-foreground lg:text-4xl"
    >
      Konversi QRIS statis ke
      <span class="text-primary">dinamis</span>
      dalam hitungan detik
    </h1>
    <p
      class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground lg:text-[15px]"
    >
      Upload QRIS statis kamu, masukkan nominal transaksi, dan dapatkan QRIS
      dinamis yang siap dipindai pembeli.
    </p>
  </section>

  <!-- Two-column tool area -->
  <main class="mx-auto w-full max-w-5xl flex-1 px-6 pb-16 lg:pb-24">
    <div class="grid gap-0 lg:grid-cols-[1fr_1fr] items-stretch">
      <!-- Left: Generate -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Generate QRIS</Card.Title>
          <Card.Description>
            Ikuti dua langkah mudah di bawah ini
          </Card.Description>
        </Card.Header>

        <Card.Content class="space-y-6">
          <!-- Step 1: Upload -->
          <div>
            <div class="mb-3 flex items-center gap-2.5">
              <span
                class="flex size-5 shrink-0 items-center justify-center text-xs font-semibold text-primary-foreground bg-primary"
              >
                1
              </span>
              <span class="text-sm font-medium text-foreground">
                Upload QRIS statis
              </span>
            </div>
            <FileUpload
              preview={imagePreview}
              {decoding}
              decoded={!!qrisPayload}
              {decodeError}
              onchange={handleFileSelect}
              inputRef={fileInput}
            />
          </div>

          <!-- Step 2: Amount -->
          <div>
            <div class="mb-3 flex items-center gap-2.5">
              <span
                class="flex size-5 shrink-0 items-center justify-center text-xs font-semibold text-primary-foreground bg-primary"
              >
                2
              </span>
              <span class="text-sm font-medium text-foreground">
                Masukkan nominal
              </span>
            </div>
            <Label for="amount">Nominal transaksi</Label>
            <div
              class="mt-1.5 flex overflow-hidden border border-input bg-input/50 transition-[color,box-shadow] focus-within:ring-3 focus-within:ring-ring/30 focus-within:border-ring"
            >
              <span
                class="flex items-center pl-3.5 pr-2 text-sm font-medium text-muted-foreground"
              >
                Rp
              </span>
              <input
                id="amount"
                type="number"
                bind:value={amount}
                placeholder="15.000"
                min="1"
                class="flex-1 h-9 min-w-0 bg-transparent border-0 px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {#if error}
            <Alert.Root variant="destructive">
              <CircleAlert class="size-4" />
              <Alert.Title>{error}</Alert.Title>
            </Alert.Root>
          {/if}

          <!-- Submit -->
          <Button
            class="w-full"
            size="lg"
            disabled={!qrisPayload || !amount || generating}
            onclick={handleGenerate}
          >
            {#if generating}
              <LoaderCircle
                class="size-4 animate-spin"
                data-icon="inline-start"
              />
            {:else}
              <RefreshCw
                class="size-4"
                data-icon="inline-start"
              />
            {/if}
            Generate QRIS dinamis
          </Button>
        </Card.Content>
      </Card.Root>

      <!-- Right: Result -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Hasil</Card.Title>
          <Card.Description>QRIS dinamis yang siap dipindai</Card.Description>
        </Card.Header>

        {#if generatedPayload}
          <Card.Content class="text-center">
            <!-- QR display -->
            <div class="mx-auto flex justify-center">
              <div
                class="grid place-items-center border border-border bg-white p-3 size-52 lg:size-60"
              >
                <img
                  src={generatedQRDataURL!}
                  alt="QRIS Dynamic"
                  class="size-full object-contain"
                />
              </div>
            </div>

            <!-- Amount -->
            <div class="mt-5">
              <p
                class="text-xs font-medium uppercase tracking-widest text-muted-foreground/60"
              >
                Nominal transaksi
              </p>
              <p
                class="mt-1 font-mono text-xl font-semibold tracking-[-0.03em] text-foreground"
              >
                Rp {parseInt(amount).toLocaleString("id-ID")}
              </p>
            </div>

            <!-- Actions -->
            <div class="mt-6 flex flex-col gap-2.5">
              <Button
                onclick={handleDownload}
                size="lg"
              >
                <Download
                  class="size-4"
                  data-icon="inline-start"
                />
                Download QR
              </Button>
            </div>
          </Card.Content>

          <div class="border-t border-border"></div>

          <Card.Content>
            <Collapsible.Root bind:open={rawOpen}>
              <Collapsible.Trigger
                class="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronRight
                  class="size-3.5 shrink-0 transition-transform [[data-state=open]>&]:rotate-90"
                />
                Lihat raw payload
              </Collapsible.Trigger>
              <Collapsible.Content>
                <div
                  class="mt-3 w-full overflow-auto bg-muted p-3 font-mono text-xs leading-relaxed text-muted-foreground break-all"
                >
                  {generatedPayload}
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          </Card.Content>
        {:else}
          <!-- Empty state -->
          <Card.Content class="flex flex-col items-center py-16 text-center">
            <div class="bg-muted border-dashed border-2">
              <QrCode
                class="size-32 text-muted-foreground/25"
                strokeWidth={1}
              />
            </div>
            <p class="mt-4 text-sm font-medium text-foreground">
              Belum ada hasil
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Isi form di sebelah kiri, lalu klik Generate
            </p>
          </Card.Content>
        {/if}
      </Card.Root>
    </div>
  </main>
</div>

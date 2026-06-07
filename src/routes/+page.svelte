<script lang="ts">
  import jsQR from "jsqr";
  import QRCode from "qrcode";
  import Check from "@lucide/svelte/icons/check";
  import Lock from "@lucide/svelte/icons/lock";
  import Download from "@lucide/svelte/icons/download";
  import Play from "@lucide/svelte/icons/play";
  import Plus from "@lucide/svelte/icons/plus";

  import Navbar from "$lib/components/ui/Navbar.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import FileUpload from "$lib/components/ui/FileUpload.svelte";
  import Alert from "$lib/components/ui/Alert.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import QrPreview from "$lib/components/ui/QrPreview.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import Collapsible from "$lib/components/ui/Collapsible.svelte";
  import TrustStrip from "$lib/components/ui/TrustStrip.svelte";

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
        color: { dark: "#1a1a2e", light: "#ffffff" },
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
    if (fileInput) fileInput.value = "";
  }
</script>

<svelte:head>
  <title>QRIS Converter — Buat QRIS Dinamis dengan Mudah</title>
</svelte:head>

<div class="flex min-h-dvh flex-col bg-surface">
  <Navbar />

  <main class="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:py-16 lg:px-8">
    <div
      class="grid items-start gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 xl:gap-20"
    >
      <!-- Left: Hero -->
      <div class="pt-1 lg:pt-4 lg:pb-10">
        <h1
          class="text-[2.25rem] leading-[1.05] font-bold tracking-[-0.045em] text-ink lg:text-[2.75rem] xl:text-[3rem]"
        >
          Konversi QRIS,
          <br />
          <span class="text-accent">convert otomatis.</span>
        </h1>

        <p class="mt-5 max-w-md text-[0.875rem] leading-relaxed text-muted">
          Upload QRIS statismu, masukkan nominal transaksi, dan dapatkan QRIS
          dinamis siap diunduh.
        </p>

        <TrustStrip>
          <Badge
            icon={Check}
            label="Decode di browser"
          />
          <Badge
            icon={Lock}
            label="Data tidak disimpan"
          />
        </TrustStrip>
      </div>

      <!-- Right: Tool panel -->
      <div>
        {#if generatedPayload}
          <!-- Result state -->
          <Card>
            <div class="flex items-center justify-between">
              <span
                class="text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-accent-strong"
              >
                Hasil generate
              </span>
              <Button
                variant="secondary"
                size="sm"
                onclick={reset}
                icon={Plus}
              >
                Buat baru
              </Button>
            </div>

            <div class="mt-5 flex items-start gap-5">
              <QrPreview src={generatedQRDataURL} />

              <div class="min-w-0">
                <p
                  class="text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-soft"
                >
                  Nominal
                </p>
                <p
                  class="mt-1 font-mono text-[1.375rem] font-semibold tracking-[-0.02em] text-ink"
                >
                  Rp {parseInt(amount).toLocaleString("id-ID")}
                </p>
                <p class="mt-0.5 text-[13px] text-muted">
                  QRIS dinamis siap dipindai
                </p>

                <div class="mt-4">
                  <Button
                    icon={Download}
                    onclick={handleDownload}
                  >
                    Download QR
                  </Button>
                </div>
              </div>
            </div>

            <Collapsible>
              {#snippet summary()}Lihat raw payload{/snippet}
              <div
                class="w-full overflow-auto rounded-md border border-border bg-surface-soft p-2 text-[0.75rem] font-mono leading-relaxed text-muted break-all"
              >
                {generatedPayload}
              </div>
            </Collapsible>
          </Card>
        {:else}
          <!-- Form state -->
          <Card>
            <h2
              class="text-[1.125rem] font-semibold tracking-[-0.02em] text-ink"
            >
              Generate QRIS
            </h2>
            <p class="mt-1 text-[0.875rem] text-muted">
              Upload QRIS statis dan masukkan nominal transaksi
            </p>

            <form
              onsubmit={(e) => {
                e.preventDefault();
                handleGenerate();
              }}
              class="mt-6 space-y-5"
            >
              <FileUpload
                label="Gambar QRIS"
                preview={imagePreview}
                {decoding}
                decoded={!!qrisPayload}
                {decodeError}
                onchange={handleFileSelect}
                inputRef={fileInput}
              />

              <Input
                label="Nominal transaksi"
                type="number"
                placeholder="15.000"
                bind:value={amount}
                min={1}
              >
                {#snippet prefix()}Rp{/snippet}
              </Input>

              {#if error}
                <Alert
                  variant="error"
                  message={error}
                />
              {/if}

              <Button
                icon={Play}
                fullWidth
                loading={generating}
                disabled={!qrisPayload || !amount}
                onclick={handleGenerate}
              >
                Generate QRIS dinamis
              </Button>
            </form>
          </Card>
        {/if}
      </div>
    </div>
  </main>
</div>

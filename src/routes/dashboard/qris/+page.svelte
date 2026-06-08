<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Alert from "$lib/components/ui/alert";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import Pencil from "@lucide/svelte/icons/pencil";
  import { Trash2 } from "@lucide/svelte/icons";
  import Plus from "@lucide/svelte/icons/plus";
  import Upload from "@lucide/svelte/icons/upload";
  import QRCode from "qrcode";
  import { onMount } from "svelte";

  let { data } = $props();

  interface QrisItem {
    id: string;
    code: string;
    name: string;
    qrisPayload: string;
    imageUrl: string;
    createdAt: string;
  }

  type QrisResponse = {
    success?: boolean;
    error?: string;
    data?: Partial<QrisItem>;
  };

  let savedQris = $derived<QrisItem[]>(data.qrisList ?? []);
  let qrisPreviewUrls = $derived<Record<string, string>>({});

  let showAddDialog = $derived(false);
  let editingId = $derived<string | null>(null);
  let loading = $derived(false);
  let errorMsg = $derived("");

  // Add dialog state
  let addName = $state("");
  let addImagePreview = $state<string | null>(null);
  let addFileInput = $state<HTMLInputElement | null>(null);
  let addPayload = $state("");
  let addDecoding = $state(false);

  // Edit form state
  let editName = $state("");
  let editImagePreview = $state<string | null>(null);
  let editFileInput = $state<HTMLInputElement | null>(null);
  let editDecoding = $state(false);
  let editPayload = $state("");
  let editHasNewImage = $state(false);
  let showDeleteConfirm = $state(false);
  let deleteTarget = $state<QrisItem | null>(null);

  let jsQRModule: typeof import("jsqr") | null = $state(null);

  onMount(async () => {
    jsQRModule = await import("jsqr");
    await hydrateQrisPreviews(savedQris);
  });

  async function hydrateQrisPreviews(items: QrisItem[]) {
    const missing = items.filter(
      (item) => item.qrisPayload && !qrisPreviewUrls[item.id],
    );
    if (missing.length === 0) return;

    const entries = await Promise.all(
      missing.map(async (item) => {
        try {
          const url = await QRCode.toDataURL(item.qrisPayload, {
            width: 160,
            margin: 1,
            color: { dark: "#0f172a", light: "#ffffff" },
          });
          return [item.id, url] as const;
        } catch {
          return [item.id, ""] as const;
        }
      }),
    );

    qrisPreviewUrls = {
      ...qrisPreviewUrls,
      ...Object.fromEntries(entries.filter(([, url]) => url)),
    };
  }

  function getQrisImageSrc(qris: QrisItem) {
    return qris.imageUrl || qrisPreviewUrls[qris.id] || "";
  }

  function useQrisPreview(qris: QrisItem) {
    if (!qrisPreviewUrls[qris.id]) return;
    savedQris = savedQris.map((item) =>
      item.id === qris.id
        ? { ...item, imageUrl: qrisPreviewUrls[qris.id] }
        : item,
    );
  }

  async function decodeQRImage(file: File): Promise<string | null> {
    if (!jsQRModule) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQRModule!.default(
            imageData.data,
            imageData.width,
            imageData.height,
          );
          resolve(code?.data ?? null);
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleAddFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      addImagePreview = ev.target?.result as string;
    };
    reader.readAsDataURL(file);

    addDecoding = true;
    const payload = await decodeQRImage(file);
    if (payload) {
      addPayload = payload;
    } else {
      errorMsg = "Gagal membaca QR code dari gambar";
    }
    addDecoding = false;
  }

  async function handleEditFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    errorMsg = "";
    editPayload = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      editImagePreview = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    editHasNewImage = true;

    editDecoding = true;
    const payload = await decodeQRImage(file);
    if (payload) {
      editPayload = payload;
    } else {
      errorMsg = "Gagal membaca QR code dari gambar";
    }
    editDecoding = false;
  }

  function openAddDialog() {
    addName = "";
    addImagePreview = null;
    addPayload = "";
    errorMsg = "";
    if (addFileInput) addFileInput.value = "";
    showAddDialog = true;
  }

  function closeAddDialog() {
    showAddDialog = false;
    addName = "";
    addImagePreview = null;
    addPayload = "";
    errorMsg = "";
    if (addFileInput) addFileInput.value = "";
  }

  async function submitAdd() {
    if (!addName.trim() || !addPayload) return;
    loading = true;
    errorMsg = "";
    try {
      const res = await fetch("/api/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName,
          qrisPayload: addPayload,
          imageBase64: addImagePreview || undefined,
        }),
      });
      const result = (await res.json()) as QrisResponse;
      if (result.success && result.data) {
        const created = result.data as QrisItem;
        savedQris = [created, ...savedQris];
        await hydrateQrisPreviews([created]);
        closeAddDialog();
      } else {
        errorMsg = result.error || "Gagal menyimpan QRIS";
      }
    } catch {
      errorMsg = "Gagal terhubung ke server";
    } finally {
      loading = false;
    }
  }

  function openEdit(item: QrisItem) {
    editingId = item.id;
    editName = item.name;
    editImagePreview = getQrisImageSrc(item) || null;
    editPayload = item.qrisPayload;
    editHasNewImage = false;
    errorMsg = "";
  }

  function cancelEdit() {
    editingId = null;
    editName = "";
    editImagePreview = null;
    editPayload = "";
    editHasNewImage = false;
    errorMsg = "";
    if (editFileInput) editFileInput.value = "";
  }

  async function submitEdit() {
    if (!editingId || !editName.trim()) return;
    if (editHasNewImage && !editPayload) {
      errorMsg = "Gagal membaca QR code dari gambar baru";
      return;
    }
    loading = true;
    errorMsg = "";
    try {
      const body: Record<string, unknown> = { name: editName };
      if (editHasNewImage) {
        body.imageBase64 = editImagePreview || null;
        body.qrisPayload = editPayload;
      }
      const res = await fetch(`/api/qris/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await res.json()) as QrisResponse;
      if (result.success) {
        const updatedPayload = result.data?.qrisPayload ?? editPayload;
        savedQris = savedQris.map((q) =>
          q.id === editingId
            ? {
                ...q,
                name: editName,
                qrisPayload: updatedPayload,
                imageUrl: result.data?.imageUrl ?? q.imageUrl,
              }
            : q,
        );
        qrisPreviewUrls = { ...qrisPreviewUrls, [editingId]: "" };
        await hydrateQrisPreviews([
          {
            id: editingId,
            code: savedQris.find((q) => q.id === editingId)?.code ?? "",
            name: editName,
            qrisPayload: updatedPayload,
            imageUrl: result.data?.imageUrl ?? "",
            createdAt: "",
          },
        ]);
        cancelEdit();
      } else {
        errorMsg = result.error || "Gagal mengupdate QRIS";
      }
    } catch {
      errorMsg = "Gagal terhubung ke server";
    } finally {
      loading = false;
    }
  }

  function requestDeleteQris(qris: QrisItem) {
    deleteTarget = qris;
    showDeleteConfirm = true;
  }

  async function deleteQris() {
    if (!deleteTarget) return;
    loading = true;
    try {
      const res = await fetch(`/api/qris/${deleteTarget.id}`, { method: "DELETE" });
      const result = (await res.json()) as QrisResponse;
      if (result.success) {
        savedQris = savedQris.filter((q) => q.id !== deleteTarget?.id);
        showDeleteConfirm = false;
        deleteTarget = null;
      }
    } catch {
      errorMsg = "Gagal menghapus QRIS";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>QRIS — QRIS Panel</title>
</svelte:head>

<div class="max-w-5xl">
  {#if errorMsg}
    <Alert.Root variant="destructive" class="mb-4">
      <CircleAlert class="size-4" />
      <Alert.Title>{errorMsg}</Alert.Title>
    </Alert.Root>
  {/if}

  <!-- Header -->
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h2 class="text-lg font-semibold tracking-[-0.02em]">QRIS Tersimpan</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Upload gambar QRIS untuk menyimpan payload QRIS statis.
      </p>
    </div>
    <Button
      onclick={openAddDialog}
      disabled={loading}
    >
      <Plus
        class="size-4"
        data-icon="inline-start"
      />
      Tambah QRIS
    </Button>
  </div>

  <!-- QRIS list -->
  {#if savedQris.length > 0}
    <div class="border border-border">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-border bg-muted/50">
            <th class="px-4 py-3 font-medium w-16">Foto</th>
            <th class="px-4 py-3 font-medium">Nama</th>
            <th class="px-4 py-3 font-medium">Kode API</th>
            <th class="px-4 py-3 font-medium">Ditambahkan</th>
            <th class="px-4 py-3 font-medium w-24"></th>
          </tr>
        </thead>
        <tbody>
          {#each savedQris as qris (qris.id)}
            <tr class="border-b border-border last:border-b-0">
              <!-- Foto -->
              <td class="px-4 py-3">
                {#if editingId === qris.id}
                  <label
                    for="edit-qris-file-{qris.id}"
                    class="relative block cursor-pointer"
                  >
                    {#if editImagePreview}
                      <div
                        class="grid size-12 place-items-center border border-border bg-white p-0.5"
                      >
                        <img
                          src={editImagePreview}
                          alt="Preview"
                          class="size-full object-contain"
                        />
                      </div>
                    {:else if qris.imageUrl}
                      <div
                        class="grid size-12 place-items-center border border-border bg-white p-0.5"
                      >
                        <img
                          src={qris.imageUrl}
                          alt={qris.name}
                          class="size-full object-contain"
                        />
                      </div>
                    {:else}
                      <div
                        class="grid size-12 place-items-center border border-dashed border-border bg-muted"
                      >
                        <Upload class="size-4 text-muted-foreground" />
                      </div>
                    {/if}
                    <input
                      id="edit-qris-file-{qris.id}"
                      type="file"
                      accept="image/*"
                      class="absolute inset-0 cursor-pointer opacity-0"
                      onchange={handleEditFile}
                      bind:this={editFileInput}
                    />
                  </label>
                {:else if qris.imageUrl}
                  <div
                    class="grid size-10 place-items-center border border-border bg-white p-0.5"
                  >
                    <img
                      src={getQrisImageSrc(qris)}
                      alt={qris.name}
                      class="size-full object-contain"
                      onerror={() => useQrisPreview(qris)}
                    />
                  </div>
                {:else if qrisPreviewUrls[qris.id]}
                  <div
                    class="grid size-10 place-items-center border border-border bg-white p-0.5"
                  >
                    <img
                      src={qrisPreviewUrls[qris.id]}
                      alt={qris.name}
                      class="size-full object-contain"
                    />
                  </div>
                {:else}
                  <div
                    class="grid size-10 place-items-center border border-border bg-muted"
                  >
                    <Upload class="size-3.5 text-muted-foreground/40" />
                  </div>
                {/if}
              </td>

              <!-- Nama -->
              <td class="px-4 py-3">
                {#if editingId === qris.id}
                  <Input
                    bind:value={editName}
                    class="h-8"
                  />
                {:else}
                  <span class="font-medium">{qris.name}</span>
                {/if}
              </td>

              <!-- Kode API -->
              <td class="px-4 py-3">
                <code class="bg-muted px-2 py-1 font-mono text-xs">
                  {qris.code}
                </code>
              </td>

              <!-- Tanggal -->
              <td class="px-4 py-3 text-muted-foreground">
                {qris.createdAt}
              </td>

              <!-- Aksi -->
              <td class="px-4 py-3">
                {#if editingId === qris.id}
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      size="xs"
                      onclick={submitEdit}
                      disabled={!editName.trim() ||
                        (editHasNewImage && !editPayload) ||
                        loading}
                    >
                      {loading ? "..." : "Simpan"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onclick={cancelEdit}
                      disabled={loading}
                    >
                      Batal
                    </Button>
                  </div>
                {:else}
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onclick={() => openEdit(qris)}
                      disabled={loading}
                    >
                      <Pencil class="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onclick={() => requestDeleteQris(qris)}
                      disabled={loading}
                    >
                      <Trash2 class="size-3.5 text-destructive" />
                    </Button>
                  </div>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="border border-border py-12 text-center">
      <p class="text-sm font-medium">Belum ada QRIS tersimpan</p>
      <p class="mt-1 text-xs text-muted-foreground">
        Klik "Tambah QRIS" untuk upload gambar QRIS statis pertama kamu.
      </p>
    </div>
  {/if}
</div>

<Dialog.Root
  bind:open={showAddDialog}
  onOpenChange={(open: boolean) => {
    if (!open) closeAddDialog();
  }}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Tambah QRIS baru</Dialog.Title>
      <Dialog.Description>
        Upload gambar QRIS statis untuk disimpan
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4">
      <Field.Field>
        <Field.Label for="add-name">Nama</Field.Label>
        <Input
          id="add-name"
          bind:value={addName}
          placeholder="Contoh: Merchant Utama"
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>Foto QRIS</Field.Label>
        <label
          for="add-qris-file"
          class="relative block cursor-pointer overflow-hidden border border-input bg-input/50 transition-colors hover:border-ring/30"
        >
          {#if addImagePreview}
            <div class="flex items-center gap-4 p-4">
              <div
                class="grid size-16 shrink-0 place-items-center border border-border bg-white p-1"
              >
                <img
                  src={addImagePreview}
                  alt="Preview"
                  class="size-full object-contain"
                />
              </div>
              <div>
                <p class="text-sm font-medium text-foreground">Foto dipilih</p>
                <p class="text-xs text-muted-foreground">
                  Klik untuk mengganti
                </p>
              </div>
            </div>
          {:else}
            <div class="flex flex-col items-center gap-2 py-8">
              <Upload class="size-5 text-muted-foreground" />
              <p class="text-sm font-medium text-foreground">
                Upload foto QRIS
              </p>
              <p class="text-xs text-muted-foreground">
                PNG atau JPG — QR code akan didecode otomatis
              </p>
            </div>
          {/if}
          <input
            id="add-qris-file"
            type="file"
            accept="image/*"
            class="absolute inset-0 cursor-pointer opacity-0"
            onchange={handleAddFile}
            bind:this={addFileInput}
          />
        </label>
      </Field.Field>
      {#if addDecoding}
        <p class="text-xs text-muted-foreground">Mendecode QR code...</p>
      {:else if addPayload}
        <p class="text-xs text-emerald-600">✓ QR code berhasil dibaca</p>
      {:else if addImagePreview}
        <p class="text-xs text-destructive">
          ✗ Gagal membaca QR code. Pastikan gambar QRIS jelas.
        </p>
      {/if}
    </div>
    <Dialog.Footer>
      <Button
        disabled={!addName.trim() || !addPayload || loading}
        onclick={submitAdd}
      >
        {loading ? "Menyimpan..." : "Simpan"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showDeleteConfirm}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Hapus QRIS?</Dialog.Title>
      <Dialog.Description>
        QRIS {deleteTarget?.name ?? "ini"} akan dihapus dari daftar tersimpan.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button
        variant="outline"
        onclick={() => {
          showDeleteConfirm = false;
          deleteTarget = null;
        }}
        disabled={loading}
      >
        Batal
      </Button>
      <Button variant="destructive" onclick={deleteQris} disabled={loading}>
        {loading ? "Menghapus..." : "Hapus"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

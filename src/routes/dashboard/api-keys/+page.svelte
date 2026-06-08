<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Collapsible from "$lib/components/ui/collapsible/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Alert from "$lib/components/ui/alert";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import Pencil from "@lucide/svelte/icons/pencil";
  import {
    KeyRound,
    Plus,
    Trash2,
    Copy,
    Eye,
    EyeOff,
    Terminal,
    Shield,
    Zap,
    RotateCcw,
  } from "@lucide/svelte/icons";

  let { data } = $props();

  interface ApiKeyItem {
    id: string;
    name: string;
    prefix: string;
    createdAt: string;
    lastUsed: string;
    plainKey?: string;
  }

  type ApiKeyCreateResponse = {
    success?: boolean;
    error?: string;
    data?: {
      id: string;
      name: string;
      prefix: string;
      createdAt: string;
      plainKey: string;
    };
  };

  type ApiKeyRotateResponse = {
    success?: boolean;
    error?: string;
    data?: {
      id: string;
      name: string;
      prefix: string;
      lastUsed: string;
      plainKey: string;
    };
  };

  type ApiResponse = {
    success?: boolean;
    error?: string;
  };

  function getInitialApiKeys() {
    return data.apiKeyList ?? [];
  }

  let apiKeys = $state<ApiKeyItem[]>(getInitialApiKeys());

  let showCreateDialog = $state(false);
  let showEditDialog = $state(false);
  let newKeyVisible = $state(false);
  let newKeyValue = $state("");
  let newKeyName = $state("");
  let rotatedKeyVisible = $state(false);
  let rotatedKeyValue = $state("");
  let loading = $state(false);
  let errorMsg = $state("");
  let showDeleteConfirm = $state(false);
  let deleteTarget = $state<ApiKeyItem | null>(null);
  let showRotateConfirm = $state(false);
  let rotateTarget = $state<ApiKeyItem | null>(null);

  // Edit state
  let editId = $state<string | null>(null);
  let editName = $state("");

  function openCreateDialog() {
    newKeyValue = "";
    newKeyName = "";
    newKeyVisible = false;
    errorMsg = "";
    showCreateDialog = true;
  }

  async function handleGenerate() {
    if (!newKeyName.trim()) return;
    loading = true;
    errorMsg = "";
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const result = (await res.json()) as ApiKeyCreateResponse;
      if (result.success && result.data) {
        newKeyValue = result.data.plainKey;
        apiKeys = [
          {
            id: result.data.id,
            name: result.data.name,
            prefix: result.data.prefix,
            createdAt: new Date(result.data.createdAt).toLocaleDateString(
              "id-ID",
              { day: "numeric", month: "short", year: "numeric" },
            ),
            lastUsed: "Belum pernah",
            plainKey: result.data.plainKey,
          },
          ...apiKeys,
        ];
      } else {
        errorMsg = result.error || "Gagal membuat API key";
      }
    } catch {
      errorMsg = "Gagal terhubung ke server";
    } finally {
      loading = false;
    }
  }

  function openEdit(key: ApiKeyItem) {
    editId = key.id;
    editName = key.name;
    rotatedKeyValue = "";
    rotatedKeyVisible = false;
    errorMsg = "";
    showEditDialog = true;
  }

  function getEditKey() {
    return apiKeys.find((key) => key.id === editId);
  }

  async function submitEdit() {
    if (!editId || !editName.trim()) return;
    loading = true;
    try {
      const res = await fetch(`/api/api-keys/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      const result = (await res.json()) as ApiResponse;
      if (result.success) {
        apiKeys = apiKeys.map((k) =>
          k.id === editId ? { ...k, name: editName } : k,
        );
        showEditDialog = false;
        editId = null;
        editName = "";
      }
    } catch {
      errorMsg = "Gagal mengupdate API key";
    } finally {
      loading = false;
    }
  }

  function requestDeleteKey(key: ApiKeyItem) {
    deleteTarget = key;
    showDeleteConfirm = true;
  }

  async function deleteKey() {
    if (!deleteTarget) return;
    loading = true;
    try {
      const res = await fetch(`/api/api-keys/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        apiKeys = apiKeys.filter((k) => k.id !== deleteTarget?.id);
        showDeleteConfirm = false;
        deleteTarget = null;
      }
    } catch {
      errorMsg = "Gagal me-revoke API key";
    } finally {
      loading = false;
    }
  }

  function requestRotateKey(key: ApiKeyItem) {
    rotateTarget = key;
    showRotateConfirm = true;
  }

  async function rotateKey() {
    if (!rotateTarget) return;
    loading = true;
    errorMsg = "";
    try {
      const res = await fetch(`/api/api-keys/${rotateTarget.id}`, { method: "PATCH" });
      const result = (await res.json()) as ApiKeyRotateResponse;
      if (result.success && result.data) {
        rotatedKeyValue = result.data.plainKey;
        rotatedKeyVisible = false;
        apiKeys = apiKeys.map((item) =>
          item.id === rotateTarget?.id
            ? {
                ...item,
                prefix: result.data?.prefix ?? item.prefix,
                plainKey: result.data?.plainKey,
                lastUsed: result.data?.lastUsed ?? "Belum pernah",
              }
            : item,
        );
        showRotateConfirm = false;
        rotateTarget = null;
      } else {
        errorMsg = result.error || "Gagal rotate API key";
      }
    } catch {
      errorMsg = "Gagal rotate API key";
    } finally {
      loading = false;
    }
  }

  async function copyKey() {
    if (newKeyValue) {
      await navigator.clipboard.writeText(newKeyValue);
    }
  }

  async function copyTableKey(key: ApiKeyItem) {
    await navigator.clipboard.writeText(key.plainKey ?? key.prefix);
  }

  async function copyRotatedKey() {
    if (rotatedKeyValue) {
      await navigator.clipboard.writeText(rotatedKeyValue);
    }
  }
</script>

<svelte:head>
  <title>API Keys — QRIS Panel</title>
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
      <h2 class="text-lg font-semibold tracking-[-0.02em]">API Keys</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Buat dan kelola API key untuk akses eksternal.
      </p>
    </div>
    <Button
      onclick={openCreateDialog}
      disabled={loading}
    >
      <Plus
        class="size-4"
        data-icon="inline-start"
      />
      Buat API Key
    </Button>
  </div>

  <!-- API Keys table -->
  {#if apiKeys.length > 0}
    <div class="border border-border">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-border bg-muted/50">
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">Key</th>
            <th class="px-4 py-3 font-medium">Dibuat</th>
            <th class="px-4 py-3 font-medium">Terakhir digunakan</th>
            <th class="px-4 py-3 font-medium w-36"></th>
          </tr>
        </thead>
        <tbody>
          {#each apiKeys as key (key.id)}
            <tr class="border-b border-border last:border-b-0">
              <td class="px-4 py-3 font-medium">{key.name}</td>
              <td class="px-4 py-3 font-mono text-sm">{key.prefix}••••••••</td>
              <td class="px-4 py-3 text-muted-foreground">{key.createdAt}</td>
              <td class="px-4 py-3 text-muted-foreground">{key.lastUsed}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onclick={() => copyTableKey(key)}
                    disabled={loading}
                    aria-label="Salin API key"
                    title="Salin API key"
                  >
                    <Copy class="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onclick={() => openEdit(key)}
                    disabled={loading}
                  >
                    <Pencil class="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onclick={() => requestDeleteKey(key)}
                    disabled={loading}
                  >
                    <Trash2 class="size-3.5 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="border border-border py-12 text-center">
      <KeyRound class="mx-auto size-8 text-muted-foreground/30" />
      <p class="mt-3 text-sm font-medium">Belum ada API key</p>
      <p class="mt-1 text-xs text-muted-foreground">
        Buat API key pertama kamu untuk mulai menggunakan external API.
      </p>
      <Button
        class="mt-4"
        onclick={openCreateDialog}
      >
        <Plus
          class="size-4"
          data-icon="inline-start"
        />
        Buat API Key
      </Button>
    </div>
  {/if}

  <!-- Documentation -->
  <div class="my-10 border-t border-border"></div>

  <div>
    <h2 class="text-lg font-semibold tracking-[-0.02em] mb-6">
      Dokumentasi API
    </h2>

    <div class="space-y-6">
      <!-- Auth -->
      <div>
        <h3 class="flex items-center gap-2 text-sm font-semibold mb-3">
          <Shield class="size-4 text-muted-foreground" />
          Autentikasi
        </h3>
        <p class="text-sm text-muted-foreground">
          Sertakan API key di header <code
            class="bg-muted px-1.5 py-0.5 font-mono text-xs"
          >
            Authorization
          </code>
          .
        </p>
        <div class="mt-3 bg-muted p-3 font-mono text-xs leading-relaxed">
          Authorization: Bearer <span class="text-foreground">
            qris_live_sk_xxxxxxxxxxxx
          </span>
        </div>
      </div>

      <!-- Endpoint -->
      <div>
        <h3 class="flex items-center gap-2 text-sm font-semibold mb-3">
          <Terminal class="size-4 text-muted-foreground" />
          Endpoint
        </h3>
        <div class="flex items-center gap-2">
          <Badge class="shrink-0 font-mono text-[10px]">POST</Badge>
          <code class="text-sm font-mono">/api/v1/qris/generate</code>
        </div>
      </div>

      <!-- Request body -->
      <div>
        <h3 class="text-sm font-semibold mb-3">Request body</h3>
        <div class="border border-border">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/50">
                <th class="px-3 py-2 font-medium">Field</th>
                <th class="px-3 py-2 font-medium">Tipe</th>
                <th class="px-3 py-2 font-medium">Wajib</th>
                <th class="px-3 py-2 font-medium">Keterangan</th>
              </tr>
            </thead>
            <tbody class="text-muted-foreground">
              <tr class="border-b border-border">
                <td class="px-3 py-2">
                  <code class="bg-muted px-1 py-0.5 font-mono text-xs">
                    qris_code
                  </code>
                </td>
                <td class="px-3 py-2">string</td>
                <td class="px-3 py-2">
                  <Badge
                    variant="secondary"
                    class="text-[10px]"
                  >
                    Ya
                  </Badge>
                </td>
                <td class="px-3 py-2">
                  Kode unik QRIS statis yang sudah disimpan
                </td>
              </tr>
              <tr class="border-b border-border">
                <td class="px-3 py-2">
                  <code class="bg-muted px-1 py-0.5 font-mono text-xs">
                    amount
                  </code>
                </td>
                <td class="px-3 py-2">integer</td>
                <td class="px-3 py-2">
                  <Badge
                    variant="secondary"
                    class="text-[10px]"
                  >
                    Ya
                  </Badge>
                </td>
                <td class="px-3 py-2">Nominal transaksi</td>
              </tr>
              <tr>
                <td class="px-3 py-2">
                  <code class="bg-muted px-1 py-0.5 font-mono text-xs">
                    reference
                  </code>
                </td>
                <td class="px-3 py-2">string</td>
                <td class="px-3 py-2">
                  <Badge
                    variant="outline"
                    class="text-[10px]"
                  >
                    Opsional
                  </Badge>
                </td>
                <td class="px-3 py-2">Referensi transaksi (contoh: INV-001)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Example request -->
      <div>
        <h3 class="text-sm font-semibold mb-3">Contoh request</h3>
        <Collapsible.Root>
          <Collapsible.Trigger
            class="flex w-full items-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight
              class="size-3.5 shrink-0 transition-transform [[data-state=open]>&]:rotate-90"
            />
            cURL
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div
              class="mt-2 bg-muted p-3 font-mono text-xs leading-relaxed overflow-x-auto"
            >
              curl -X POST https://qris.example.com/api/v1/qris/generate \
              <br />
              &nbsp;&nbsp;-H "Authorization: Bearer qris_live_sk_xxxxxxxxxxxx" \
              <br />
              &nbsp;&nbsp;-H "Content-Type: application/json" \
              <br />
              &nbsp;&nbsp;-d '{"{"}"qris_code": "qris_abc123def4567890",
              "amount": 15000, "reference": "INV-001"{"}"}'
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>

      <!-- Response -->
      <div>
        <h3 class="text-sm font-semibold mb-3">Response</h3>
        <p class="text-sm text-muted-foreground">
          Sukses (
          <code class="bg-muted px-1.5 py-0.5 font-mono text-xs">200</code>
          ):
        </p>
        <div
          class="mt-2 bg-muted p-3 font-mono text-xs leading-relaxed overflow-x-auto"
        >
          {"{"}"success": true, "qris_code": "qris_abc123def4567890", "amount":
          15000, "reference": "INV-001", "payload": "00020101021226..."{"}"}
        </div>
      </div>

      <!-- Rate limit -->
      <div>
        <h3 class="flex items-center gap-2 text-sm font-semibold mb-3">
          <Zap class="size-4 text-muted-foreground" />
          Rate limit
        </h3>
        <p class="text-sm text-muted-foreground">
          <strong>60 request per menit</strong>
          per API key. Melebihi batas akan mendapat
          <code class="bg-muted px-1.5 py-0.5 font-mono text-xs">429</code>
          .
        </p>
      </div>
    </div>
  </div>
</div>

<Dialog.Root
  bind:open={showCreateDialog}
  onOpenChange={(open: boolean) => {
    if (!open) {
      showCreateDialog = false;
      newKeyValue = "";
      newKeyName = "";
    }
  }}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Buat API Key baru</Dialog.Title>
      <Dialog.Description>
        Key akan ditampilkan sekali setelah dibuat.
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4">
      {#if !newKeyValue}
        <Field.Field>
          <Field.Label for="new-key-name">Nama</Field.Label>
          <Input
            id="new-key-name"
            bind:value={newKeyName}
            placeholder="Contoh: Production API"
          />
        </Field.Field>
      {:else}
        <div class="space-y-2">
          <p class="text-sm font-medium">API Key kamu</p>
          <div class="flex items-center gap-2">
            <code
              class="flex-1 overflow-x-auto bg-muted p-3 font-mono text-xs break-all"
            >
              {newKeyVisible ? newKeyValue : "••••••••••••••••••••••••••••••••"}
            </code>
            <Button
              variant="ghost"
              size="icon-xs"
              onclick={() => (newKeyVisible = !newKeyVisible)}
            >
              {#if newKeyVisible}
                <EyeOff class="size-3.5" />
              {:else}
                <Eye class="size-3.5" />
              {/if}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onclick={copyKey}
            >
              <Copy class="size-3.5" />
            </Button>
          </div>
          <p class="text-xs text-destructive">
            ⚠ Simpan key ini sekarang. Kamu tidak bisa melihatnya lagi.
          </p>
        </div>
      {/if}
    </div>
    <Dialog.Footer>
      {#if !newKeyValue}
        <Button
          class="flex-1"
          disabled={!newKeyName.trim() || loading}
          onclick={handleGenerate}
        >
          {loading ? "Generating..." : "Generate"}
        </Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root
  bind:open={showEditDialog}
  onOpenChange={(open: boolean) => {
    if (!open) {
      showEditDialog = false;
      editId = null;
      editName = "";
      rotatedKeyValue = "";
      rotatedKeyVisible = false;
    }
  }}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit API Key</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-4">
      <Field.Field>
        <Field.Label for="edit-key-name">Name</Field.Label>
        <Input
          id="edit-key-name"
          bind:value={editName}
          placeholder="Contoh: Production API"
        />
      </Field.Field>
      <div class="border-t border-border pt-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium">Rotate API key</p>
            <p class="mt-1 text-xs text-muted-foreground">
              Key lama akan langsung tidak berlaku.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={loading || !editId}
            onclick={() => {
              const key = getEditKey();
              if (key) requestRotateKey(key);
            }}
          >
            <RotateCcw
              class="size-4"
              data-icon="inline-start"
            />
            Rotate
          </Button>
        </div>

        {#if rotatedKeyValue}
          <div class="mt-4 space-y-2">
            <p class="text-sm font-medium">API Key baru</p>
            <div class="flex items-center gap-2">
              <code
                class="flex-1 overflow-x-auto bg-muted p-3 font-mono text-xs break-all"
              >
                {rotatedKeyVisible ? rotatedKeyValue : "••••••••••••••••••••••••••••••••"}
              </code>
              <Button
                variant="ghost"
                size="icon-xs"
                onclick={() => (rotatedKeyVisible = !rotatedKeyVisible)}
              >
                {#if rotatedKeyVisible}
                  <EyeOff class="size-3.5" />
                {:else}
                  <Eye class="size-3.5" />
                {/if}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onclick={copyRotatedKey}
              >
                <Copy class="size-3.5" />
              </Button>
            </div>
            <p class="text-xs text-destructive">
              Simpan key ini sekarang. Kamu tidak bisa melihatnya lagi.
            </p>
          </div>
        {/if}
      </div>
    </div>
    <Dialog.Footer>
      <Button
        variant="outline"
        onclick={() => (showEditDialog = false)}
        disabled={loading}
      >
        Batal
      </Button>
      <Button
        disabled={!editName.trim() || loading}
        onclick={submitEdit}
      >
        {loading ? "Menyimpan..." : "Simpan"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showDeleteConfirm}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Revoke API key?</Dialog.Title>
      <Dialog.Description>
        API key {deleteTarget?.name ?? "ini"} akan langsung tidak bisa digunakan lagi.
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
      <Button variant="destructive" onclick={deleteKey} disabled={loading}>
        {loading ? "Memproses..." : "Revoke"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showRotateConfirm}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Rotate API key?</Dialog.Title>
      <Dialog.Description>
        Key lama untuk {rotateTarget?.name ?? "API key ini"} akan langsung tidak berlaku.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button
        variant="outline"
        onclick={() => {
          showRotateConfirm = false;
          rotateTarget = null;
        }}
        disabled={loading}
      >
        Batal
      </Button>
      <Button onclick={rotateKey} disabled={loading}>
        {loading ? "Memproses..." : "Rotate"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

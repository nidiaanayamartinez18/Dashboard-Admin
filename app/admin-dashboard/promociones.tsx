import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

/* ===================== Tipos ===================== */

type OfferType = "Spa" | "Tour" | "Cena" | "Hospedaje" | "Otro";
type OfferStatus = "Borrador" | "Publicado" | "Archivado";

type Offer = {
  id: string;
  titulo: string;
  tipo: OfferType;
  descripcion?: string;
  precio: number;
  precioAntes?: number;
  fechaInicio?: string; // ISO
  fechaFin?: string;    // ISO
  cupo?: number;
  destacado?: boolean;
  estado: OfferStatus;
  createdAt: string;    // ISO
  imageUri?: string;
};

const fx = (n: number) =>
  `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

const todayISO = () => new Date().toISOString().slice(0, 10);

/* =================== Datos demo =================== */

const DEMO: Offer[] = [
  {
    id: "p1",
    titulo: "Circuito Relax 60’ + Hidroterapia",
    tipo: "Spa",
    descripcion: "Acceso a circuito + masaje relajante de 60 minutos.",
    precio: 1290,
    precioAntes: 1800,
    fechaInicio: "2025-09-30",
    fechaFin: "2025-10-20",
    destacado: true,
    estado: "Publicado",
    createdAt: "2025-09-10",
    cupo: 50,
    imageUri:
      "https://images.unsplash.com/photo-1556228453-efd1e0dd7d0e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p2",
    titulo: "Tour al centro histórico al atardecer",
    tipo: "Tour",
    descripcion: "Guía bilingüe, snack y entrada a museos.",
    precio: 720,
    estado: "Borrador",
    createdAt: "2025-09-14",
  },
  {
    id: "p3",
    titulo: "Cena de tres tiempos – Terraza",
    tipo: "Cena",
    descripcion: "Incluye copa de vino. Vista panorámica.",
    precio: 560,
    precioAntes: 780,
    estado: "Publicado",
    createdAt: "2025-09-18",
    fechaFin: "2025-12-31",
  },
  {
    id: "p4",
    titulo: "2x1 en noche de domingo",
    tipo: "Hospedaje",
    descripcion: "Aplican restricciones. No acumulable.",
    precio: 1390,
    estado: "Archivado",
    createdAt: "2025-08-29",
  },
];

/* ====== helpers de vigencia (para KPIs) ====== */

const isAfter = (a?: string, b?: string) =>
  a && b ? new Date(a).getTime() > new Date(b).getTime() : false;
const isBefore = (a?: string, b?: string) =>
  a && b ? new Date(a).getTime() < new Date(b).getTime() : false;

function isActiveNow(o: Offer, today = todayISO()) {
  if (o.estado !== "Publicado") return false;
  const startsOk = !o.fechaInicio || !isAfter(o.fechaInicio, today);
  const endsOk = !o.fechaFin || !isBefore(o.fechaFin, today) || o.fechaFin === today;
  return startsOk && endsOk;
}
function isUpcoming(o: Offer, today = todayISO()) {
  if (o.estado !== "Publicado") return false;
  return !!o.fechaInicio && isAfter(o.fechaInicio, today);
}
function isExpired(o: Offer, today = todayISO()) {
  if (o.estado !== "Publicado") return false;
  return !!o.fechaFin && isBefore(o.fechaFin, today);
}

/* ================ Pantalla principal ================ */

export default function Promociones() {
  const [offers, setOffers] = React.useState<Offer[]>(DEMO);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "Todos" | "Publicado" | "Borrador" | "Archivado"
  >("Todos");

  // “Recientes” como toggle (desmarcado por defecto)
  const [sortRecent, setSortRecent] = React.useState(false);

  // Crear/editar modal
  const [editing, setEditing] = React.useState<Offer | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (o: Offer) => {
    setEditing(o);
    setShowForm(true);
  };

  const upsertOffer = (data: Partial<Offer>) => {
    if (editing) {
      setOffers((prev) =>
        prev.map((o) => (o.id === editing.id ? { ...o, ...data } as Offer : o))
      );
    } else {
      const base: Offer = {
        id: Math.random().toString(36).slice(2),
        titulo: data.titulo || "Nueva promoción",
        tipo: (data.tipo as OfferType) || "Otro",
        precio: data.precio ?? 0,
        precioAntes: data.precioAntes,
        descripcion: data.descripcion,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        cupo: data.cupo,
        destacado: !!data.destacado,
        estado: (data.estado as OfferStatus) || "Borrador",
        createdAt: todayISO(),
        imageUri: data.imageUri,
      };
      setOffers((p) => [base, ...p]);
    }
    setShowForm(false);
  };

  // Acciones
  const publish = (o: Offer) =>
    setOffers((p) => p.map((x) => (x.id === o.id ? { ...x, estado: "Publicado" } : x)));
  const unpublish = (o: Offer) =>
    setOffers((p) => p.map((x) => (x.id === o.id ? { ...x, estado: "Borrador" } : x)));
  const archive = (o: Offer) =>
    setOffers((p) => p.map((x) => (x.id === o.id ? { ...x, estado: "Archivado" } : x)));
  const unarchive = (o: Offer) =>
    setOffers((p) => p.map((x) => (x.id === o.id ? { ...x, estado: "Borrador" } : x)));
  const remove = (o: Offer) =>
    Alert.alert("Eliminar promoción", "Esta acción no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => setOffers((p) => p.filter((x) => x.id !== o.id)),
      },
    ]);
  const toggleFeatured = (o: Offer) =>
    setOffers((p) =>
      p.map((x) => (x.id === o.id ? { ...x, destacado: !x.destacado } : x))
    );

  // Archivados: solo visibles en “Archivado”
  const filteredBase = offers.filter((o) => {
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      o.titulo.toLowerCase().includes(q) ||
      (o.descripcion || "").toLowerCase().includes(q) ||
      o.tipo.toLowerCase().includes(q);
    if (!matchQ) return false;

    if (statusFilter === "Archivado") return o.estado === "Archivado";
    if (statusFilter === "Publicado") return o.estado === "Publicado";
    if (statusFilter === "Borrador") return o.estado === "Borrador";
    // "Todos" excluye archivados
    return o.estado !== "Archivado";
  });

  const filtered = sortRecent
    ? [...filteredBase].sort((a, b) =>
        (b.createdAt || "").localeCompare(a.createdAt || "")
      )
    : filteredBase;

  // KPIs
  const kActivas = offers.filter((o) => isActiveNow(o)).length;
  const kProximas = offers.filter((o) => isUpcoming(o)).length;
  const kExpiradas = offers.filter((o) => isExpired(o)).length;
  const kBorradores = offers.filter((o) => o.estado === "Borrador").length;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 28 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}></Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={styles.search}>
            <Feather name="search" size={16} color="#6b7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por título, tipo o descripción"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
          </View>

          <View style={{ width: 8 }} />
          <Pressable
            onPress={openCreate}
            style={[styles.btn, { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" }]}
          >
            <Feather name="plus" size={16} color="#0a7a36" />
            <Text style={[styles.btnText, { color: "#0a7a36" }]}>Nueva promoción</Text>
          </Pressable>
        </View>
      </View>

      {/* KPIs */}
      <View style={styles.kpiRow}>
        <KPI icon="play" label="Activas" value={String(kActivas)} highlight />
        <KPI icon="clock" label="Programadas" value={String(kProximas)} />
        <KPI icon="archive" label="Expiradas" value={String(kExpiradas)} />
        <KPI icon="file-text" label="Borradores" value={String(kBorradores)} />
      </View>

      {/* Filtros — ESTADO + chip 'Recientes' (toggle) */}
      <View style={styles.filtersRow}>
        {(["Todos", "Publicado", "Borrador", "Archivado"] as const).map((f, i) => {
          const active = statusFilter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setStatusFilter(f)}
              style={[
                styles.chip,
                active ? { backgroundColor: "#eef2ff", borderColor: "#c7ddff" } : null,
                i > 0 ? { marginLeft: 8 } : null,
              ]}
            >
              <Text style={[styles.chipText, active ? { color: "#0b3a8a" } : null]}>{f}</Text>
            </Pressable>
          );
        })}

        <View style={{ width: 8 }} />
        <Pressable
          onPress={() => setSortRecent((v) => !v)}
          style={[
            styles.chip,
            sortRecent ? { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" } : null,
          ]}
        >
          <Text style={[styles.chipText, sortRecent ? { color: "#0a7a36" } : null]}>
            Recientes
          </Text>
        </Pressable>
      </View>

      {/* Cards */}
      <View style={{ marginTop: 10 }}>
        {filtered.map((o) => {
          const discount =
            o.precioAntes && o.precioAntes > o.precio
              ? Math.round((1 - o.precio / o.precioAntes) * 100)
              : 0;

          return (
            <View key={o.id} style={styles.card}>
              {/* Layout tipo miniatura (como tu ejemplo) */}
              <View style={{ flexDirection: "row" }}>
                {/* Imagen a la izquierda con cinta “Destacada” */}
                <View style={styles.thumbWrap}>
                  {o.imageUri ? (
                    <Image source={{ uri: o.imageUri }} style={styles.thumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Feather name="image" size={20} color="#94a3b8" />
                    </View>
                  )}
                  {o.destacado ? (
                    <View style={styles.flagFeatured}>
                      <Feather name="star" size={12} color="#16a34a" />
                      <Text style={styles.flagFeaturedText}>Destacada</Text>
                    </View>
                  ) : null}
                </View>

                {/* Contenido a la derecha */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  {/* Título + Tipo (sin estado) */}
                  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                    <Text style={styles.offerTitle}>{o.titulo}</Text>
                    <View style={{ width: 6 }} />
                    <View style={[styles.pillType, typeColor(o.tipo)]}>
                      <Text style={styles.pillTypeText}>{o.tipo}</Text>
                    </View>
                  </View>

                  {/* Descripción */}
                  {o.descripcion ? (
                    <Text style={styles.offerDesc} numberOfLines={2}>
                      {o.descripcion}
                    </Text>
                  ) : null}

                  {/* Fechas */}
                  {(o.fechaInicio || o.fechaFin) && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                      <Feather name="calendar" size={14} color="#475569" />
                      <Text style={styles.muted}>
                        {" "}
                        {o.fechaInicio ? new Date(o.fechaInicio).toLocaleDateString("es-MX") : "—"}{" "}
                        — {o.fechaFin ? new Date(o.fechaFin).toLocaleDateString("es-MX") : "—"}
                      </Text>
                    </View>
                  )}

                  {/* Precio + descuento */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                    <Text style={styles.priceNow}>{fx(o.precio)}</Text>
                    {o.precioAntes ? (
                      <Text style={styles.priceBefore}>{fx(o.precioAntes)}</Text>
                    ) : null}
                    {discount > 0 ? (
                      <View style={styles.discountPill}>
                        <Text style={styles.discountText}>{discount}% OFF</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Cupo */}
                  {o.cupo ? (
                    <Text style={[styles.muted, { marginTop: 2 }]}>Cupo: {o.cupo}</Text>
                  ) : null}
                </View>
              </View>

              {/* Acciones (sin cambios) */}
              <View style={styles.actionsRow}>
                {o.estado === "Publicado" ? (
                  <Pressable onPress={() => unpublish(o)} style={[styles.btn, styles.btnGhost]}>
                    <Feather name="pause" size={16} color="#111827" />
                    <Text style={[styles.btnText, { color: "#111827" }]}>Remover</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => publish(o)} style={[styles.btn, styles.btnPrimary]}>
                    <Feather name="play" size={16} color="#111827" />
                    <Text style={[styles.btnText, { color: "#111827" }]}>Publicar</Text>
                  </Pressable>
                )}

                <View style={{ width: 8 }} />
                <Pressable onPress={() => openEdit(o)} style={[styles.btn, styles.btnInfo]}>
                  <Feather name="edit-3" size={16} color="#111827" />
                  <Text style={[styles.btnText, { color: "#111827" }]}>Editar</Text>
                </Pressable>

                <View style={{ width: 8 }} />
                {o.estado === "Archivado" ? (
                  <Pressable onPress={() => unarchive(o)} style={[styles.btn, styles.btnGhost]}>
                    <Feather name="inbox" size={16} color="#111827" />
                    <Text style={[styles.btnText, { color: "#111827" }]}>Recuperar</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => archive(o)} style={[styles.btn, styles.btnGhost]}>
                    <Feather name="archive" size={16} color="#111827" />
                    <Text style={[styles.btnText, { color: "#111827" }]}>Archivar</Text>
                  </Pressable>
                )}

                <View style={{ width: 8 }} />
                <Pressable onPress={() => remove(o)} style={[styles.btn, styles.btnDanger]}>
                  <MaterialIcons name="delete" size={16} color="#111827" />
                  <Text style={[styles.btnText, { color: "#111827" }]}>Eliminar</Text>
                </Pressable>

                <View style={{ flex: 1 }} />
                <Pressable onPress={() => toggleFeatured(o)} style={styles.linkStar}>
                  <Feather name="star" size={14} color={o.destacado ? "#16a34a" : "#64748b"} />
                  <Text
                    style={[
                      styles.linkStarText,
                      { color: o.destacado ? "#16a34a" : "#64748b" },
                    ]}
                  >
                    {o.destacado ? "Quitar destacado" : "Marcar destacado"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 28 }}>
            <Text style={{ color: "#64748b" }}>No hay promociones con estos filtros.</Text>
          </View>
        ) : null}
      </View>

      {/* Modal crear/editar */}
      <OfferForm
        visible={showForm}
        initial={editing || undefined}
        onClose={() => setShowForm(false)}
        onSubmit={upsertOffer}
      />
    </ScrollView>
  );
}

/* ================ Formulario ================ */

function OfferForm({
  visible,
  initial,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initial?: Offer;
  onClose: () => void;
  onSubmit: (data: Partial<Offer>) => void;
}) {
  const [titulo, setTitulo] = React.useState(initial?.titulo ?? "");
  const [tipo, setTipo] = React.useState<OfferType>(initial?.tipo ?? "Otro");
  const [descripcion, setDescripcion] = React.useState(initial?.descripcion ?? "");
  const [precio, setPrecio] = React.useState(String(initial?.precio ?? ""));
  const [precioAntes, setPrecioAntes] = React.useState(String(initial?.precioAntes ?? ""));
  const [fi, setFi] = React.useState(initial?.fechaInicio ?? "");
  const [ff, setFf] = React.useState(initial?.fechaFin ?? "");
  const [cupo, setCupo] = React.useState(String(initial?.cupo ?? ""));
  const [destacado, setDestacado] = React.useState(!!initial?.destacado);
  const [estado, setEstado] = React.useState<OfferStatus>(initial?.estado ?? "Borrador");
  const [imageUri, setImageUri] = React.useState<string | undefined>(initial?.imageUri);

  React.useEffect(() => {
    if (visible) {
      setTitulo(initial?.titulo ?? "");
      setTipo(initial?.tipo ?? "Otro");
      setDescripcion(initial?.descripcion ?? "");
      setPrecio(String(initial?.precio ?? ""));
      setPrecioAntes(String(initial?.precioAntes ?? ""));
      setFi(initial?.fechaInicio ?? "");
      setFf(initial?.fechaFin ?? "");
      setCupo(String(initial?.cupo ?? ""));
      setDestacado(!!initial?.destacado);
      setEstado(initial?.estado ?? "Borrador");
      setImageUri(initial?.imageUri);
    }
  }, [visible, initial]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled) {
      const uri = result.assets[0]?.uri;
      setImageUri(uri);
    }
  };

  const save = () => {
    const p = Number(precio) || 0;
    const pa = precioAntes ? Number(precioAntes) : undefined;
    const c = cupo ? Number(cupo) : undefined;
    if (!titulo.trim()) return Alert.alert("Título requerido");
    onSubmit({
      titulo: titulo.trim(),
      tipo,
      descripcion: descripcion.trim() || undefined,
      precio: p,
      precioAntes: pa,
      fechaInicio: fi || undefined,
      fechaFin: ff || undefined,
      cupo: c,
      destacado,
      estado,
      imageUri,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={styles.modalTitle}>{initial ? "Editar promoción" : "Nueva promoción"}</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={onClose} style={styles.iconGhost}>
              <MaterialIcons name="close" size={18} color="#475569" />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 460 }}>
            <Text style={styles.label}>Título</Text>
            <TextInput
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ej. Circuito Relax 60’ + Hidroterapia"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: 10 }]}>Tipo</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {(["Spa", "Tour", "Cena", "Hospedaje", "Otro"] as const).map((t) => {
                const active = tipo === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setTipo(t)}
                    style={[
                      styles.chip,
                      active ? { backgroundColor: "#eef2ff", borderColor: "#c7ddff" } : null,
                      { marginRight: 8, marginBottom: 8 },
                    ]}
                  >
                    <Text style={[styles.chipText, active ? { color: "#0b3a8a" } : null]}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>Descripción</Text>
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Detalles de la oferta"
              placeholderTextColor="#9ca3af"
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              multiline
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Precio</Text>
                <TextInput
                  value={precio}
                  onChangeText={(t) => setPrecio(t.replace(/[^\d]/g, ""))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Precio antes (opcional)</Text>
                <TextInput
                  value={precioAntes}
                  onChangeText={(t) => setPrecioAntes(t.replace(/[^\d]/g, ""))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Inicio (YYYY-MM-DD)</Text>
                <TextInput
                  value={fi}
                  onChangeText={setFi}
                  placeholder="2025-09-30"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Fin (YYYY-MM-DD)</Text>
                <TextInput
                  value={ff}
                  onChangeText={setFf}
                  placeholder="2025-10-20"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Cupo (opcional)</Text>
                <TextInput
                  value={cupo}
                  onChangeText={(t) => setCupo(t.replace(/[^\d]/g, ""))}
                  keyboardType="number-pad"
                  placeholder="50"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Estado</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {(["Borrador", "Publicado", "Archivado"] as const).map((e) => {
                    const active = estado === e;
                    return (
                      <Pressable
                        key={e}
                        onPress={() => setEstado(e)}
                        style={[
                          styles.chip,
                          active ? { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" } : null,
                          { marginRight: 8, marginBottom: 8 },
                        ]}
                      >
                        <Text style={[styles.chipText, active ? { color: "#0a7a36" } : null]}>
                          {e}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Imagen */}
            <Text style={[styles.label, { marginTop: 10 }]}>Selecciona una imagen</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable onPress={pickImage} style={[styles.btn, styles.btnInfo]}>
                <Feather name="image" size={16} color="#0b3a8a" />
                <Text style={[styles.btnText, { color: "#0b3a8a" }]}>
                  {imageUri ? "Cambiar imagen" : "Subir imagen"}
                </Text>
              </Pressable>
              {imageUri ? (
                <>
                  <View style={{ width: 10 }} />
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: 72, height: 48, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" }}
                  />
                  <View style={{ width: 8 }} />
                  <Pressable onPress={() => setImageUri(undefined)} style={[styles.btn, styles.btnGhost]}>
                    <Text style={[styles.btnText, { color: "#111827" }]}>Quitar</Text>
                  </Pressable>
                </>
              ) : null}
            </View>

            <Pressable
              onPress={() => setDestacado((d) => !d)}
              style={[
                styles.switchRow,
                { marginTop: 12, borderColor: destacado ? "#c8f0d3" : "#e5e7eb" },
              ]}
            >
              <Feather name="star" size={16} color={destacado ? "#16a34a" : "#64748b"} />
              <Text
                style={[
                  styles.switchText,
                  { color: destacado ? "#16a34a" : "#111827" },
                ]}
              >
                {destacado ? "Marcar como destacado (activo)" : "Marcar como destacado"}
              </Text>
            </Pressable>
          </ScrollView>

          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
            <Pressable onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={[styles.btnText, { color: "#111827" }]}>Cancelar</Text>
            </Pressable>
            <View style={{ width: 8 }} />
            <Pressable onPress={save} style={[styles.btn, styles.btnPrimary]}>
              <Text style={[styles.btnText, { color: "#0b3a8a" }]}>
                {initial ? "Guardar" : "Crear"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ================ Subcomponentes ================ */

function KPI({ icon, label, value, highlight = false }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.kpi, highlight ? { borderColor: "#c7ddff", backgroundColor: "#eef2ff" } : null]}>
      <View style={[styles.kpiIcon, { backgroundColor: highlight ? "#eaf1ff" : "#f3f4f6" }]}>
        <Feather name={icon} size={16} color="#0b3a8a" />
      </View>
      <View>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
      </View>
    </View>
  );
}

/* ================ Helpers de estilos dinámicos ================ */

function typeColor(t: OfferType) {
  switch (t) {
    case "Spa":
      return { backgroundColor: "#eaf1ff", borderColor: "#c7ddff" };
    case "Tour":
      return { backgroundColor: "#fff7e6", borderColor: "#fde68a" };
    case "Cena":
      return { backgroundColor: "#efe7ff", borderColor: "#d8b4fe" };
    case "Hospedaje":
      return { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" };
    default:
      return { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" };
  }
}

/* ======================= Estilos ======================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f6f8fb", padding: 18 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },

  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: 280,
  },
  searchInput: { marginLeft: 8, paddingVertical: 4, color: "#111827", flex: 1 },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  btnText: { fontWeight: "800", marginLeft: 6 },
  btnPrimary: { backgroundColor: "#eaf1ff", borderColor: "#c7ddff" },
  btnInfo: { backgroundColor: "#fff", borderColor: "#e5e7eb" },
  btnGhost: { backgroundColor: "#fff", borderColor: "#e5e7eb" },
  btnDanger: { backgroundColor: "#ffe6ee", borderColor: "#ffc7d9" },

  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  kpi: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minWidth: 200,
    flexGrow: 1,
  },
  kpiIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 10 },
  kpiLabel: { color: "#64748b", fontWeight: "700", fontSize: 14 },
  kpiValue: { color: "#0f172a", fontWeight: "800", fontSize: 18 },

  filtersRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
  },
  chipText: { fontWeight: "800", color: "#111827" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    marginTop: 10,
  },

  /* Miniatura izquierda */
  thumbWrap: {
    width: 170,
    height: 110,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    position: "relative",
  },
  thumb: { width: "100%", height: "100%" },
  thumbPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  flagFeatured: {
    position: "absolute",
    left: 8,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#e6f9ed",
    borderColor: "#c8f0d3",
    borderWidth: 1,
    borderRadius: 999,
  },
  flagFeaturedText: { marginLeft: 4, fontSize: 12, fontWeight: "800", color: "#16a34a" },

  /* Pills y textos */
  pillType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillTypeText: { fontWeight: "800", fontSize: 12, color: "#0b3a8a" },

  offerTitle: { fontWeight: "700", color: "#0f172a" , fontSize: 18},
  offerDesc: { marginTop: 4, color: "#475569", fontSize: 15 },

  priceNow: { fontWeight: "800", color: "#0f172a" , fontSize: 15  },
  priceBefore: { marginLeft: 8, color: "#64748b", textDecorationLine: "line-through" , fontSize: 15 },
  discountPill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#c8f0d3",
    backgroundColor: "#e6f9ed",
  },
  discountText: { color: "#0a7a36", fontWeight: "800", fontSize: 12 },

  muted: { color: "#64748b" },

  actionsRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  linkStar: { flexDirection: "row", alignItems: "center" },
  linkStarText: { fontWeight: "800", marginLeft: 6 },

  /* Modal */
  modalRoot: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  modalCard: {
    width: "94%",
    maxWidth: 860,
    maxHeight: "92%",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
  },
  modalTitle: { fontWeight: "700", color: "#0f172a" , fontSize: 20},
  iconGhost: { padding: 8, borderRadius: 8 },

  label: { fontWeight: "600", color: "#0f172a", marginBottom: 6 , fontSize: 16 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  switchText: { fontWeight: "800", marginLeft: 8, color: "#111827" },
});

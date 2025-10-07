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

/* ================= Tipos ================= */

type NewsStatus = "Borrador" | "Publicado" | "Archivado";

type News = {
  id: string;
  title: string;
  summary?: string;
  content?: string;       // opcional (cuerpo largo futuro)
  date: string;           // fecha de publicación (ISO yyyy-mm-dd)
  author?: string;
  status: NewsStatus;
  imageUri?: string;      // portada (png/jpg)
  // category?: string;   // (lo mantenemos fuera de la UI como pediste)
};

/* =============== Utilidades =============== */

const todayISO = () => new Date().toISOString().slice(0, 10);

/* =============== Demo inicial =============== */

const DEMO: News[] = [
  {
    id: "n1",
    title: "Spa: nuevas cabinas listas",
    summary: "Renovamos nuestras cabinas y sala de hidroterapia.",
    date: "2025-09-28",
    author: "Gerencia Hotel",
    status: "Publicado",
    imageUri: undefined,
  },
  {
    id: "n2",
    title: "Menú de temporada en restaurante",
    summary: "Platos de otoño disponibles durante octubre.",
    date: "2025-10-01",
    author: "Chef Ejecutivo",
    status: "Borrador",
  },
  {
    id: "n3",
    title: "Mantenimiento programado en piso 3",
    summary: "Trabajos nocturnos sin afectar operación diurna.",
    date: "2025-10-05",
    author: "Mantenimiento",
    status: "Archivado",
  },
];

/* =============== Pantalla principal =============== */

export default function Noticias() {
  const [news, setNews] = React.useState<News[]>(DEMO);
  const [filter, setFilter] = React.useState<"Todos" | "Publicado" | "Borrador" | "Archivado">("Todos");

  // Modal
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<News | null>(null);

  // Form state (sin “destacada” y sin “categoría”, tal como pediste)
  const [fTitle, setFTitle] = React.useState("");
  const [fSummary, setFSummary] = React.useState("");
  const [fContent, setFContent] = React.useState("");
  const [fDate, setFDate] = React.useState(todayISO());
  const [fAuthor, setFAuthor] = React.useState("Gerencia Hotel");
  const [fStatus, setFStatus] = React.useState<NewsStatus>("Borrador");
  const [fImage, setFImage] = React.useState<string | undefined>(undefined);

  const resetForm = () => {
    setEditing(null);
    setFTitle("");
    setFSummary("");
    setFContent("");
    setFDate(todayISO());
    setFAuthor("Gerencia Hotel");
    setFStatus("Borrador");
    setFImage(undefined);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (n: News) => {
    setEditing(n);
    setFTitle(n.title);
    setFSummary(n.summary ?? "");
    setFContent(n.content ?? "");
    setFDate(n.date);
    setFAuthor(n.author ?? "Gerencia Hotel");
    setFStatus(n.status);
    setFImage(n.imageUri);
    setOpen(true);
  };

  const saveNews = () => {
    if (!fTitle.trim()) {
      Alert.alert("Falta título", "Escribe un título para la noticia.");
      return;
    }
    if (editing) {
      setNews((prev) =>
        prev.map((n) =>
          n.id === editing.id
            ? {
                ...n,
                title: fTitle.trim(),
                summary: fSummary.trim() || undefined,
                content: fContent.trim() || undefined,
                date: fDate,
                author: fAuthor.trim() || undefined,
                status: fStatus,
                imageUri: fImage,
              }
            : n
        )
      );
    } else {
      const newItem: News = {
        id: "n" + Math.random().toString(36).slice(2, 8),
        title: fTitle.trim(),
        summary: fSummary.trim() || undefined,
        content: fContent.trim() || undefined,
        date: fDate,
        author: fAuthor.trim() || undefined,
        status: fStatus,
        imageUri: fImage,
      };
      setNews((prev) => [newItem, ...prev]);
    }
    setOpen(false);
  };

  const removeNews = (id: string) => {
    Alert.alert("Eliminar", "Esta acción no se puede deshacer.", [
      { text: "Cancelar" },
      { text: "Eliminar", style: "destructive", onPress: () => setNews((p) => p.filter((x) => x.id !== id)) },
    ]);
  };

  const publishNews = (id: string) => {
    setNews((prev) => prev.map((n) => (n.id === id ? { ...n, status: "Publicado" } : n)));
  };

  const archiveNews = (id: string) => {
    // Al archivar, desaparece de todos los filtros excepto “Archivado”
    setNews((prev) => prev.map((n) => (n.id === id ? { ...n, status: "Archivado" } : n)));
  };

  const filtered = news.filter((n) => {
    if (filter === "Todos") return n.status !== "Archivado"; // por consistencia, “Todos” excluye archivados
    return n.status === filter;
  });

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!res.canceled && res.assets?.length) {
      setFImage(res.assets[0].uri);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 28 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Noticias</Text>
        <Pressable onPress={openCreate} style={[styles.btn, { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" }]}>
          <MaterialIcons name="note-add" size={16} color="#0a7a36" />
          <Text style={[styles.btnText, { color: "#0a7a36" }]}>Nueva noticia</Text>
        </Pressable>
      </View>

      {/* Filtros de estado */}
      <View style={styles.filtersRow}>
        {(["Todos", "Publicado", "Borrador", "Archivado"] as const).map((f, i) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
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
      </View>

      {/* Lista */}
      <View style={{ marginTop: 10 }}>
        {filtered.map((n) => (
          <View key={n.id} style={styles.card}>
            {/* Portada a la izquierda (si hay imagen) */}
            {n.imageUri ? (
              <Image source={{ uri: n.imageUri }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                <Feather name="image" size={18} color="#94a3b8" />
              </View>
            )}

            <View style={{ flex: 1 }}>
              {/* Título (sin chip de categoría, como pediste) */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                <Text style={styles.cardTitle}>{n.title}</Text>
              </View>

              {/* Resumen */}
              {n.summary ? <Text style={styles.cardSummary}>{n.summary}</Text> : null}

              {/* Metadatos */}
              <View style={styles.metaRow}>
                <Feather name="calendar" size={14} color="#475569" />
                <Text style={styles.metaText}> {new Date(n.date).toLocaleDateString("es-MX")}</Text>
                {n.author ? (
                  <>
                    <View style={{ width: 10 }} />
                    <Feather name="user" size={14} color="#475569" />
                    <Text style={styles.metaText}> {n.author}</Text>
                  </>
                ) : null}
              </View>

              {/* Acciones */}
              <View style={{ flexDirection: "row", marginTop: 10 }}>
                {n.status !== "Publicado" && n.status !== "Archivado" ? (
                  <Pressable onPress={() => publishNews(n.id)} style={[styles.btn, styles.btnPrimary]}>
                    <Feather name="play" size={16} color="#324c85ff" />
                    <Text style={[styles.btnText, { color: "#324c85ff" }]}>Publicar</Text>
                  </Pressable>
                ) : null}

                <View style={{ width: 8 }} />
                <Pressable onPress={() => openEdit(n)} style={[styles.btn, styles.btnGhost]}>
                  <MaterialIcons name="edit" size={16} color="#324c85ff" />
                  <Text style={[styles.btnText, { color: "#324c85ff" }]}>Editar</Text>
                </Pressable>

                <View style={{ width: 8 }} />
                {n.status !== "Archivado" ? (
                  <Pressable onPress={() => archiveNews(n.id)} style={[styles.btn, styles.btnArchive]}>
                    <Feather name="archive" size={16} color="#324c85ff" />
                    <Text style={[styles.btnText, { color: "#324c85ff" }]}>Archivar</Text>
                  </Pressable>
                ) : null}

                <View style={{ width: 8 }} />
                <Pressable onPress={() => removeNews(n.id)} style={[styles.btn, styles.btnDanger]}>
                  <MaterialIcons name="delete" size={16} color="#111827" />
                  <Text style={[styles.btnText, { color: "#111827" }]}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Text style={{ color: "#64748b" }}>No hay noticias para este filtro.</Text>
          </View>
        ) : null}
      </View>

      {/* Modal crear/editar (sin “Marcar como destacada”) */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.overlay} onPress={() => setOpen(false)} />
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={styles.modalTitle}>{editing ? "Editar noticia" : "Nueva noticia"}</Text>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => setOpen(false)} style={styles.iconGhost}>
                <MaterialIcons name="close" size={18} color="#475569" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 460 }}>
              {/* Título */}
              <Text style={styles.label}>Título</Text>
              <TextInput
                value={fTitle}
                onChangeText={setFTitle}
                placeholder="Título de la noticia"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />

              {/* Resumen */}
              <Text style={[styles.label, { marginTop: 10 }]}>Resumen (opcional)</Text>
              <TextInput
                value={fSummary}
                onChangeText={setFSummary}
                placeholder="Breve descripción…"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />

              {/* Contenido (opcional/uso futuro) */}
              <Text style={[styles.label, { marginTop: 10 }]}>Contenido (opcional)</Text>
              <TextInput
                value={fContent}
                onChangeText={setFContent}
                placeholder="Cuerpo completo (uso futuro)"
                placeholderTextColor="#9ca3af"
                multiline
                style={[styles.input, { height: 120, textAlignVertical: "top" }]}
              />

              {/* Fecha y estado */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Fecha de publicación (YYYY-MM-DD)</Text>
                  <TextInput
                    value={fDate}
                    onChangeText={setFDate}
                    placeholder="2025-10-01"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Estado</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {(["Borrador", "Publicado", "Archivado"] as const).map((s, i) => {
                      const active = fStatus === s;
                      return (
                        <Pressable
                          key={s}
                          onPress={() => setFStatus(s)}
                          style={[
                            styles.chip,
                            active ? { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" } : null,
                            i > 0 ? { marginLeft: 8 } : null,
                          ]}
                        >
                          <Text style={[styles.chipText, active ? { color: "#0a7a36" } : null]}>{s}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Autor */}
              <Text style={[styles.label, { marginTop: 10 }]}>Autor (opcional)</Text>
              <TextInput
                value={fAuthor}
                onChangeText={setFAuthor}
                placeholder="Gerencia Hotel"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />

              {/* Imagen */}
              <Text style={[styles.label, { marginTop: 10 }]}>Selecciona una imagen</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Pressable onPress={pickImage} style={[styles.btn, styles.btnPrimary]}>
                  <Feather name="image" size={16} color="#0b3a8a" />
                  <Text style={[styles.btnText, { color: "#0b3a8a" }]}>
                    {fImage ? "Cambiar imagen" : "Subir imagen"}
                  </Text>
                </Pressable>
                {fImage ? (
                  <>
                    <Image source={{ uri: fImage }} style={{ width: 80, height: 52, borderRadius: 8, marginLeft: 10 }} />
                    <Pressable onPress={() => setFImage(undefined)} style={[styles.btn, styles.btnGhost, { marginLeft: 8 }]}>
                      <Text style={[styles.btnText, { color: "#111827" }]}>Quitar</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
              {/* (El campo “Marcar como destacada” fue removido) */}

              {/* Botones del modal */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 14 }}>
                <Pressable onPress={() => setOpen(false)} style={[styles.btn, styles.btnGhost]}>
                  <Text style={[styles.btnText, { color: "#111827" }]}>Cancelar</Text>
                </Pressable>
                <View style={{ width: 8 }} />
                <Pressable onPress={saveNews} style={[styles.btn, { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" }]}>
                  <MaterialIcons name="check-circle" size={16} color="#0a7a36" />
                  <Text style={[styles.btnText, { color: "#0a7a36" }]}>Guardar</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ================= Estilos ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f6f8fb", padding: 18 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },

  filtersRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
  },
  chipText: { fontWeight: "800", color: "#111827" , fontSize: 15},

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dce8ffff",
    padding: 12,
    marginTop: 10,
  },
  cardImage: { width: 132, height: 88, borderRadius: 10, marginRight: 12, backgroundColor: "#e5e7eb" },
  cardImagePlaceholder: { alignItems: "center", justifyContent: "center" },

  cardTitle: { fontWeight: "800", color: "#07215eff", fontSize: 17 },
  cardSummary: { color: "#334155", marginTop: 2 },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  metaText: { color: "#475569", fontSize: 14 },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  btnText: { fontWeight: "800", marginLeft: 6 },
  btnPrimary: { backgroundColor: "#eef2ff", borderColor: "#c7ddff" },
  btnGhost: { backgroundColor: "#fff", borderColor: "#e5e7eb" },
  btnArchive: { backgroundColor: "#fff", borderColor: "#e5e7eb" },
  btnDanger: { backgroundColor: "#fff1f2", borderColor: "#fecdd3" },

  /* Modal */
  modalRoot: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.08)" },
  modalCard: {
    width: "94%",
    maxWidth: 920,
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
  },
  modalTitle: { fontWeight: "700", color: "#0f172a" , fontSize: 20},
  iconGhost: { padding: 8, borderRadius: 8 },

  label: { fontWeight: "600", color: "#0f172a", marginBottom: 6 , fontSize: 16},
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
  },
});

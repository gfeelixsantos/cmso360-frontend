import {
  AlertTriangle,
  Building2,
  Handshake,
  FileSignature,
  FlaskConical,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

export const NAV_ITEMS = [
  { id: "assinatura-digital", label: "Assinatura Digital", icon: FileSignature },
  {
    id: "auditoria",
    label: "Auditoria",
    icon: ShieldCheck,
    requiredPerfil: "MASTER",
  },
  { id: "exames", label: "Exames", icon: FlaskConical },
  { id: "prestadores", label: "Prestadores", icon: Handshake, requiredPerfil: "MASTER" },
  { id: "usuarios", label: "Profissionais", icon: Users },
  { id: "unidades", label: "Unidades", icon: Building2, requiredPerfil: "MASTER" },
  { id: "usuario", label: "Usuário", icon: User },
  { id: "riscos", label: "Riscos", icon: AlertTriangle, requiredPerfil: "MASTER" },
];

export function getVisibleSettingsItems(userPerfil) {
  return NAV_ITEMS.filter(
    (item) => !item.requiredPerfil || item.requiredPerfil === userPerfil,
  );
}

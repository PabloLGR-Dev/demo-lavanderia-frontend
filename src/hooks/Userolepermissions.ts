// src/hooks/useRolePermissions.ts
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/roleConfig';

export function useRolePermissions() {
    const { idRol } = useAuth();

    const isAdmin = idRol === ROLES.ADMIN;
    const isEmpleado = idRol === ROLES.EMPLEADO;

    const canDelete = isAdmin; // Solo administradores pueden eliminar
    const canEdit = true; // Todos pueden editar por ahora
    const canCreate = true; // Todos pueden crear por ahora

    return {
        isAdmin,
        isEmpleado,
        canDelete,
        canEdit,
        canCreate,
        idRol,
    };
}
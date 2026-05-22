export class PermissionService {
  canViewRoom() {
    return false;
  }

  canWriteMessage() {
    return false;
  }

  canViewDocument() {
    return false;
  }

  canExportDocument() {
    return false;
  }
}

export const permissionService = new PermissionService();

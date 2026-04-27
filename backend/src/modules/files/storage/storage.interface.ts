/**
 * Interface de stockage abstrait
 * Permet une implémentation polymorphe (Local, S3, etc.)
 * Prépare la migration future vers AWS S3
 */
export interface IStorageService {
  /**
   * Sauvegarde un fichier dans le stockage
   * @param fileBuffer Contenu du fichier
   * @param filename Nom du fichier à sauvegarder
   * @returns Chemin ou URI du fichier sauvegardé
   */
  saveFile(fileBuffer: Buffer, filename: string): Promise<string>

  /**
   * Récupère un fichier du stockage
   * @param filepath Chemin ou URI du fichier
   * @returns Buffer du fichier
   */
  getFile(filepath: string): Promise<Buffer>

  /**
   * Supprime un fichier du stockage
   * @param filepath Chemin ou URI du fichier
   */
  deleteFile(filepath: string): Promise<void>

  /**
   * Vérifie l'existence d'un fichier
   * @param filepath Chemin ou URI du fichier
   * @returns true si le fichier existe
   */
  fileExists(filepath: string): Promise<boolean>
}


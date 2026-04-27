import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm'

export class AddUploadTokenToFilesTable1704844800002 implements MigrationInterface {
  name = 'AddUploadTokenToFilesTable1704844800002'

  async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne uploadToken
    await queryRunner.addColumn(
      'files',
      new TableColumn({
        name: 'uploadToken',
        type: 'uuid',
        isNullable: false,
        default: 'uuid_generate_v4()',
      }),
    )

    // Créer un index unique sur uploadToken pour les accès rapides
    await queryRunner.createIndex(
      'files',
      new TableIndex({
        name: 'IDX_UPLOAD_TOKEN',
        columnNames: ['uploadToken'],
        isUnique: true,
      }),
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer l'index
    await queryRunner.dropIndex('files', 'IDX_UPLOAD_TOKEN')

    // Supprimer la colonne
    await queryRunner.dropColumn('files', 'uploadToken')
  }
}


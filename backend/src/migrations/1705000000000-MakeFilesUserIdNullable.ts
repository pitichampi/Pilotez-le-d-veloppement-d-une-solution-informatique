import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm'

export class MakeFilesUserIdNullable1705000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('files')
    if (!table) return

    const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.length === 1 && fk.columnNames[0] === 'userId')
    if (foreignKey) {
      await queryRunner.dropForeignKey('files', foreignKey)
    }

    await queryRunner.changeColumn(
      'files',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
      }),
    )

    await queryRunner.createForeignKey(
      'files',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('files')
    if (!table) return

    const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.length === 1 && fk.columnNames[0] === 'userId')
    if (foreignKey) {
      await queryRunner.dropForeignKey('files', foreignKey)
    }

    await queryRunner.changeColumn(
      'files',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: false,
      }),
    )

    await queryRunner.createForeignKey(
      'files',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    )
  }
}

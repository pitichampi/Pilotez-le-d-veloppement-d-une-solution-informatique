import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from '@common/common.module'
import { File } from './entities/file.entity'
import { FilesService } from './files.service'
import { FilesController } from './files.controller'
import { LocalStorageService } from './storage/local-storage.service'

@Module({
  imports: [TypeOrmModule.forFeature([File]), CommonModule],
  controllers: [FilesController],
  providers: [FilesService, LocalStorageService],
  exports: [FilesService],
})
export class FilesModule {}


import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from '@common/common.module'
import { File } from './entities/file.entity'
import { FilesService } from './files.service'
import { FilesController } from './files.controller'

@Module({
  imports: [TypeOrmModule.forFeature([File]), CommonModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}


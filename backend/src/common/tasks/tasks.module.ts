import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { File } from '@modules/files/entities/file.entity'
import { TasksService } from './tasks.service'

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

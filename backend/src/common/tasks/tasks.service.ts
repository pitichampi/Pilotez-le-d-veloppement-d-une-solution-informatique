import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { File } from '@modules/files/entities/file.entity'
import * as fs from 'fs'

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(File)
    private filesRepository: Repository<File>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredFiles() {
    const expiredFiles = await this.filesRepository.find({
      where: {
        expiresAt: LessThan(new Date()),
      },
    })

    for (const file of expiredFiles) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
      await this.filesRepository.delete(file.id)
    }

    console.log(`Deleted ${expiredFiles.length} expired files`)
  }
}


import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import * as path from 'path'
import { File } from './entities/file.entity'

interface MulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
  buffer: Buffer
}

@Injectable()
export class FilesService {
  private readonly storagePath: string

  constructor(
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    private configService: ConfigService,
  ) {
    this.storagePath = this.configService.get('FILE_STORAGE_PATH') || '/app/uploads'
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true })
    }
  }

   async create(fileData: MulterFile, userId: string): Promise<File> {
     const filename = `${Date.now()}-${fileData.originalname}`
     const filepath = path.join(this.storagePath, filename)

    fs.writeFileSync(filepath, fileData.buffer)

    const file = this.filesRepository.create({
      name: filename,
      originalName: fileData.originalname,
      mimetype: fileData.mimetype,
      size: fileData.size,
      path: filepath,
      storageType: 'local',
      userId,
    })

    return this.filesRepository.save(file)
  }

  async findAll(userId?: string): Promise<File[]> {
    const query = this.filesRepository.createQueryBuilder('file')
    if (userId) {
      query.where('file.userId = :userId', { userId })
    }
    return query.orderBy('file.createdAt', 'DESC').getMany()
  }

  async findOne(id: string): Promise<File> {
    return this.filesRepository.findOne({ where: { id } })
  }

  async remove(id: string): Promise<void> {
    const file = await this.findOne(id)
    if (file) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
      await this.filesRepository.delete(id)
    }
  }

  async getFileStream(id: string): Promise<{ stream: fs.ReadStream; filename: string }> {
    const file = await this.findOne(id)
    if (!file || !fs.existsSync(file.path)) {
      throw new Error('File not found')
    }
    return {
      stream: fs.createReadStream(file.path),
      filename: file.originalName,
    }
  }
}


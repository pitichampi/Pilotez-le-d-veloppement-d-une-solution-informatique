import { DataSource } from 'typeorm'
import { User } from './src/modules/users/entities/user.entity'
import { File } from './src/modules/files/entities/file.entity'

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/appdb',
  entities: [User, File],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
})


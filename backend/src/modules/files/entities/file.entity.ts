import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '@modules/users/entities/user.entity'

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 255 })
  originalName: string

  @Column({ type: 'varchar', length: 50 })
  mimetype: string

  @Column({ type: 'bigint' })
  size: number

  @Column({ type: 'varchar', length: 255 })
  path: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  storageType: string

  @Column({ type: 'uuid' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}


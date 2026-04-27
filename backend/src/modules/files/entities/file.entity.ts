import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { User } from '@modules/users/entities/user.entity'

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Token d'accès unique pour le partage du fichier
   * US01: Génération UUID v4 unique pour chaque upload
   */
  @Column({ type: 'uuid' })
  @Index({ unique: true })
  uploadToken: string

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

  /**
   * Tags pour organiser les fichiers
   * US08: 0-N tags, 30 chars max par tag
   */
  @Column({ type: 'text', nullable: true })
  tags?: string // Stocké en JSON string

  /**
   * Mot de passe haché pour protéger le fichier
   * US09: Mot de passe optionnel 6+ chars, haché avec Bcrypt
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  filePasswordHash?: string

  /**
   * Expiration du fichier
   * US10: 1-7 jours, purge automatique via Cron
   */
  @Column({ type: 'timestamp', nullable: true })
  @Index()
  expiresAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}


import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmConfigService } from '@config/typeorm.config'
import { AuthModule } from '@modules/auth/auth.module'
import { UsersModule } from '@modules/users/users.module'
import { FilesModule } from '@modules/files/files.module'
import { TasksModule } from '@common/tasks/tasks.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new TypeOrmConfigService(configService).createTypeOrmOptions()
      },
    }),
    AuthModule,
    UsersModule,
    FilesModule,
    TasksModule,
  ],
})
export class AppModule {}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { OneToMany } from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';

@Entity('statuses')
export class Status {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    unique: true,
    length: 50,
  })
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Task, (task) => task.status)
  tasks!: Task[];
}
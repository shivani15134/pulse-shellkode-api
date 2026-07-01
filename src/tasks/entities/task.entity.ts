import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { ManyToOne, JoinColumn } from 'typeorm';
import { Status } from '../../statuses/entities/status.entity';
import { User } from '../../users/user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    unique: true,
	length: 50,
  })
  ticketId!: string;

  @Column({
    length: 255,
  })
  title!: string;

  @Column({
	type: 'varchar',
    nullable: true,
    length: 20,
  })
  priority!: string | null;

  @Column({
    type: 'date',
    nullable: true,
  })
  startDate!: Date | null;

  @Column({
    type: 'date',
    nullable: true,
  })
endDate!: Date | null;

@Column({
  length: 20,
  default: 'Task',
})
type!: string;

@ManyToOne(() => Status, (status) => status.tasks)
@JoinColumn({ name: 'status_id' })
status!: Status;

@ManyToOne(() => User, {
  nullable: true,
})
@JoinColumn({ name: 'assignee_id' })
assignee!: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

@ManyToOne(() => Task, (task) => task.subtasks, { nullable: true })
@JoinColumn({ name: 'parentId' })
parent!: Task | null;

@OneToMany(() => Task, (task) => task.parent)
subtasks!: Task[];

@Column({
  type: "int",
  nullable: true,
})
estimatedHours!: number | null;

@Column({
  type: "int",
  nullable: true,
})
spentHours!: number | null;
  
}

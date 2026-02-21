import { generateId } from "@libs/shared/src/utils/id.util";
import { Column, Entity, PrimaryColumn } from "typeorm";

import { UserTable } from "../../constants";

@Entity(UserTable.USERS)
export class UserEntity {

    @PrimaryColumn('uuid')
    id: string = generateId();

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;
}
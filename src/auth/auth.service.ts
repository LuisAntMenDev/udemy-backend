import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {

    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
        private jwtService: JwtService
    ) { }

    async create(createUserDto: CreateUserDto) {
        try {
            const { password, ...userData } = createUserDto;
            const newUser = new this.userModel({
                password: bcrypt.hashSync(password, 10),
                ...userData
            });
            await newUser.save();
            const { password: _, ...user } = newUser.toJSON();
            return user;
        } catch (error) {
            if (error.code === 11000) {
                throw new BadRequestException(`${createUserDto.email} already exists!`)
            } else {
                throw new InternalServerErrorException('Something terrible happened!')
            }
        }
    }

    async register(registerDto: RegisterUserDto) {
        const user = await this.create(registerDto);
        return { user, token: this.getJwtToken({ id: user._id }) }
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const user = await this.userModel.findOne({ email });
        if (!user) throw new UnauthorizedException('User not found!');
        if (!bcrypt.compareSync(password, user.password)) throw new UnauthorizedException('Unvalid credentials!');
        const { password: _, ...rest } = user.toJSON();
        return { user: rest, token: this.getJwtToken({ id: user.id }) };
    }

    findAll() {
        return this.userModel.find();
    }

    async findUserById(id: string) {
        const user = await this.userModel.findById(id);
        const { password, ...rest } = user.toJSON();
        return rest;
    }

    findOne(id: number) {
        return `This action returns a #${id} auth`;
    }

    update(id: number, updateAuthDto: UpdateAuthDto) {
        return `This action updates a #${id} auth`;
    }

    remove(id: number) {
        return `This action removes a #${id} auth`;
    }

    getJwtToken(payload: JwtPayload) {
        const token = this.jwtService.sign(payload);
        return token;
    }
}

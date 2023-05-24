import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";
import * as argon from 'argon2';
import { AuthDto } from "./dto";
import { JwtService } from '@nestjs/jwt';
import { Dto } from "src/auth/common_dto";
import { compound_owner } from "@prisma/client";

@Injectable()
export class AuthService{
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
      ) {}
      
      async getUserById(id: number): Promise<compound_owner | undefined> {
        return this.prisma.compound_owner.findUnique({ where: { id } });
      }
    
      async compoundOwnerSignup(dto: Dto) {
        // generate the password hash
        const hash = await argon.hash(dto.password);
        console.log(hash)
        // save the new user in the db
        try {
          const user = await this.prisma.User.create({
            data: {
              user_name: dto.first_name,
              hash: hash,
              email: dto.email
            },
          });
        // console.log(user.password)
        return this.signToken(user.id, user.email,user.role);
      
        } catch (error) {
            if (error.code === 'P2002') {
              throw new ForbiddenException(
                  'Credentials taken',
              );
            }

          console.log(error.code,error)
          throw error;
        }
      }
      cheking(){
        return 'authorized'
      }


      async spotUserSignup(dto: Dto) {
        // generate the password hash
        const hash = await argon.hash(dto.password);
        // save the new user in the db
        try {
          const user = await this.prisma.User.create({
            data: {
              user_name: dto.first_name,
              email: dto.email,
              hash: hash             
              
            },
          });
        console.log(user.email)
        return this.signToken(user.id, user.email, user.role);
      
        } catch (error) {
            if (error.code === 'P2002') {
              throw new ForbiddenException(
                  'Credentials taken',
              );
            }
          console.log(error.code,error)
          throw error;
        }
      }
       
      async compoundOwnerSignin(dto:AuthDto){
        const user = await this.prisma.User.findUnique({
          where: {
            email: dto.email
          }
        })
        console.log(user.password)
        if (!user){
          throw new ForbiddenException("Incorrect Email")
        }
      
      const paswMatches = argon.verify(dto.password,user.hash)
      // const paswMatches = user.password === dto.password
      

      if(!paswMatches){
        throw new ForbiddenException("Incorrect password")
      }
      // delete user.password
      // return user
      // const { password: _, ...userWithoutPassword } = user;

      return this.signToken(user.id, user.email,user.role);
      }


async signToken(
    userId: number,
    email: string,
    role: string
  ): Promise<{ access_token: string}> {
    const payload = {
      sub: userId,
      email,
      role:role
    };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(
      payload,
      {
        expiresIn: '35m',
        secret: secret,
      },
    );
    return {
      access_token: token
    };
  }
}

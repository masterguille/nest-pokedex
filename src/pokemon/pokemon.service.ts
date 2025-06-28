import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {

  private defaultLimit: number;
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService,
  ){
    console.log(process.env.DEFAULT_LIMIT);
    this.defaultLimit = configService.get<number>('defaultLimit')??3;
    
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try { 
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch(error){
      this.handleExceptions(error);
    }
  } 

  findAll(paginationDto: PaginationDto) {

    const {limit=this.defaultLimit, offset=0} = paginationDto;
    //los valores se asigna si el parametro no tiene el dato
    return this.pokemonModel.find()
      .limit(limit)
      .skip(offset)
      .sort({
        no: 1     //ordena la columna no de manera ascendente
      })
  }

  async findOne(term: string) {
    
    let pokemon: Pokemon|null = null; 
    
    if (!isNaN(+term)){
     pokemon = await this.pokemonModel.findOne({no: term});
    }

    if (!pokemon && isValidObjectId(term)){
      pokemon = await this.pokemonModel.findById(term);
    }

    if (!pokemon){
      pokemon = await this.pokemonModel.findOne({name: term.toLowerCase().trim()});
    }
   
    if (!pokemon) 
      throw new NotFoundException(`Pokemon with Id, Name or No "${term}" not found`);

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    //validamos que exista
    const pokemon = await this.findOne(term);
    // porsiaca convertimos a minusculas el nombre
    if (updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    try {
      await pokemon.updateOne(updatePokemonDto);  
    } catch (error) {
      this.handleExceptions(error);
    }
    return {...pokemon.toJSON(), ...updatePokemonDto};
  }

  async remove(id: string) {
   // const pokemon = await this.findOne(id);
   // await pokemon.deleteOne();
   const {deletedCount} = await this.pokemonModel.deleteOne({_id: id});
   if (deletedCount===0)
    throw new BadRequestException(`Pokemon with id "${id}" not found`);
   return;
  }

  private handleExceptions(error:any){
      if (error.code === 11000){
        throw new BadRequestException(`Pokemon exists in DB ${JSON.stringify(error.keyValue)}`);
      } 
      console.log(error);
      throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }
}

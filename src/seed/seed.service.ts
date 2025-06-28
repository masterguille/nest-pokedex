import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interfase';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {

  constructor(
      @InjectModel(Pokemon.name)
      private readonly pokemonModel: Model<Pokemon>,
      private readonly http: AxiosAdapter,
  ){}
    
  async executeSeed(){

    await this.pokemonModel.deleteMany({}); // limpio tablas antes del insert

    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650')
  
    const pokemonToInsert: {name:string, no:number}[] = []; 

    data.results.forEach(async({name, url}) => {
      
      const segments = url.split('/');
      //separo los campos de la URL
      const no = +segments[segments.length -2];
      //me quedo con el penultimo y lo convierto a numerico
      //const pokemon = await this.pokemonModel.create({name, no});
      pokemonToInsert.push({name, no});
    })
    await this.pokemonModel.insertMany(pokemonToInsert);
    return 'Seed executed';
  }
}

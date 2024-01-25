
## Documentação Pré Engenharia

#### Retorna programas instalados, quantidade e os hostnames que estão

```http
  GET /api/wr00001
```

| Tipo     | Descrição |
| :------- | :-------- |
| `string` |   retorna todos os programas, quantidade de maquinas instaladas e o hostname das maquinas instaladas        |


#### Retorna média de uso de RAM  

```http
  GET /api/wr00002
```

 | Tipo       | Descrição                                   |
| :--------- | :------------------------------------------ |
 | `string` | retorna a média de uso de ram nos ultimos 10 minutos |


#### Retorna quantidade de hostnames online e o nome dos hostnames

```http
  GET /api/wr00003
```

 | Tipo       | Descrição                                   |
| :--------- | :------------------------------------------ |
 | `string` | retorna quantidade e nome dos hostnames online |



#### Retorna o total de hd de toda planta

 ```http
  GET /api/wr00004
```

 | Tipo       | Descrição                                   |
| :--------- | :------------------------------------------ |
 | `string` | retorno em TBs, apenas numero  |


 


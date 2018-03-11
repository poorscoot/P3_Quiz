const {models} = require('./model');
const {log, bigLog, errorLog, colorize} = require('./out');
const Sequelize = require('sequelize');

/**
*Muestra la ayuda.
*
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.helpCmd = rl => {
	log('Commandos:');
  	log('  h|help - Muestra esta ayuda.');	
  	log('  list -Listar los quizes existentes.');	
  	log('  show <id> - Muestra la pregunta y la respuesta del quiz indicado.');	
  	log('  add - Añadir un nuevo quiz interactivamente.');	
  	log('  delete <id> - Borrar el quiz indicado.');	
  	log('  edit <id> - Editar el quiz indicado.');	
  	log('  test <id> - Probar el quiz indicado.');	
  	log('  p|play - Jugar a preguntar aleatoriamente todos los quizzes.');	
  	log('  credits - Créditos.');	
  	log('  q|quit - Salir del programa.');
  	rl.prompt();
  	};

/**
*Lista todos los quizzes existentes en el modelo.
*
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.listCmd = rl => {
  	models.quiz.findAll()
  	.then(quizzes => {
  		quizzes.forEach(quiz => {
  			log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
  		})
  	})
  	.catch(error => {
  		errorLog(error.message);
  	})
  	.then(() => {
  		rl.prompt();
  	})
};

/**
* Esta función devuelve una promesa que:
*	- Valida que se ha introducido un valor para el parametro.
*	- Convierte el parametro en un numero entero.
* Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
*
* @param id Parametro con el índice a validar.
*/
const validateId = id => {
	return new Sequelize.Promise((resolve, reject) => {
		if ( typeof id === "undefined") {
			reject(new Error(`Falta el parametro <id>.`));
		} else {
			id= parseInt(id); //coger la parte entera y descartar lo demas
			if (Number.isNaN(id)) {
				reject(new Error(`El valor del parametro <id> no es un número.`));
			} else {
				resolve(id);
			}
		}
	});
};

/**
*Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
*
*	@param id Clave del quiz a mostrar.
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.showCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		log(` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
	})
	.catch(error => {
		errorLog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
* Esta funcion convierte la llamada rl.question, que está basada en callbacks, en una
* basada en promesas.
*
* Esta función devuelve una promesa que cuando se cumple, proporciona el texto introducido
* Entonces la llamada a then hay que hacer la promesa devuelta sera:
*	.then(answer => {...})
*
* También colorea en rojo el texto de la pregunta, elimina espacios al principio y final.
*
* @param rl Objeto readLine usado para implementar el CLI.
* @param text Pregunta que hay que hacerle al usuario.
*/
const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

/**
*Añade un nuevo quiz al modelo.
*Pregunta interactivamente por la pregunta y la respuesta.
*
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.addCmd = rl => {
  	makeQuestion(rl, ' Introduzca una pregunta: ')
  	.then(q => {
  		return makeQuestion(rl, ' Introduzca la respuesta ')
  		.then(a => {
  			return {question: q, answer:a};
  		});
  	})
  	.then(quiz => {
  		return models.quiz.create(quiz);
  	})
  	.then((quiz) => {
  		log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  	})
  	.catch(Sequelize.ValidationError, error => {
  		errorLog('El quiz es erroneo:');
  		error.errors.forEach(({message}) => errorLog(message));
  	})
  	.catch(error => {
  		errorLog(error.message);
  	})
  	.then(() => {
  		rl.prompt();
  	});
};

/**
*Borra un quiz del modelo.
*
*	@param id Clave del quiz a borrar en el modelo.
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.deleteCmd = (rl, id) => {
  	validateId(id)
  	.then(id => models.quiz.destroy({where: {id}}))
  	.catch(error => {
  		errorLog(error.message);
  	})
  	.then(() => {
  		rl.prompt();
  	});
};

/**
*Edita un quiz del modelo.
*
*	@param id Clave del quiz a borrar en el modelo.
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.editCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, ' Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
			return makeQuestion(rl, ' Introduzca la respuesta ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorLog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorLog(message));
	})
	.catch(error => {
		errorLog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
*Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
*
*	@param id Clave del quiz a probar.
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.testCmd = (rl, id) => {
	validateId(id)
	.then(id => {
		id => models.quiz.findById(id)
	})
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		process.stdout.isTTY && setTimeout(() => {}, 0);
		return makeQuestion(rl, `${quiz.question}? `)
		.then(answer => {
			if((quiz.answer).trim().toLowerCase() === answer.trim().toLowerCase()){
				log('Su respuesta es correcta.');
				bigLog(' Correcta','green');
			} else {
				log('Su respuesta es incorrecta.');
				bigLog(' Incorrecta','red');
		 	}
		});
	})
	.catch(error => {
		errorLog(error.message);
	})
	.then(() => {
		rl.prompt();
	});	
}; 

/**
*Pregunta todos los quizzes dexistentes en el modelo en orden aleatorio.
*Se gana si se contesta a todos satisfactoriamente.
*
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.playCmd = rl => {
	validateID(id)
	.then(id => {
		let score = 0;
		let toBeResolved = modes.quizz.findAll();
	})
	.then(tobeResolved => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		const playOne = () => {
  	  		if (toBeResolved.length<1) {
  	  			log('No hay preguntas.','red');
  	  			rl.prompt();
  	  		} else {
  	  			let id = parseInt(Math.random()*(toBeResolved.length-1));
  	  			let quiz = toBeResolved[id];
	  	  		if (typeof quiz === "undefined"){
					errorLog(`Fallo.`);
					rl.prompt();
				} else {
					try {
						process.stdout.isTTY && setTimeout(() => {}, 0);
						return makeQuestion(rl, `${quiz.question}? `)
						.then(answer => {
							if((quiz.answer).trim().toLowerCase() === answer.trim().toLowerCase()){
								score++;
								log(`CORRECTO - LLeva ${score} aciertos.`);
								toBeResolved.splice(id,1);
								if (toBeResolved. length < 1){
									log('No hay nada más que preguntar.');
									log(`Fin del juego. Aciertos: ${score}`);
									bigLog(` ${score}`,'magenta');
									rl.prompt();
								} else {
									playOne();
								}
							} else {
								log('INCORRECTO.');
								log(`Fin del juego. Aciertos: ${score}`);
								bigLog(` ${score}`,'magenta');
								rl.prompt();
							}
		  					});
					}
  	  		}
  	  	}
  	  	playOne();
	}
  	  	
})
.catch(error => {
		errorLog(error.message);
})
.then(() => {
		rl.prompt();
	});	
}; 

/**
*Muestra los nombres de los autores de la práctica.
*
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.creditsCmd = rl => {
  	  	log('Autores de la práctica:');
    	log('Alexander de la Torre Astanin', 'green');
    	log('Daniel Fuertes Coiras','green');
    	rl.prompt();
  	};  	

/**
*Terminar el programa.
*
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.quitCmd = rl => {
  	rl.close();
  	};  
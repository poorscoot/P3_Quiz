const model = require('./model');
const {log, bigLog, errorLog, colorize} = require('./out');

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
	model.getAll().forEach((quiz,id) => {
  
		log(` [${colorize(id, 'magenta')}]:  ${quiz.question}`);
	});
  	rl.prompt();
};

/**
*Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
*
*	@param id Clave del quiz a mostrar.
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.showCmd = (rl, id) => {
	if (typeof id === "undefined"){
		errorLog(`Falta el parámetro id.`);
	} else {
		try {
			const quiz = model.getByIndex(id);
			log(` [${colorize(id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
		} catch(error) {
			errorLog(error.message);
		}
	}
	rl.prompt();
};

/**
*Añade un nuevo quiz al modelo.
*Pregunta interactivamente por la pregunta y la respuesta.
*
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.addCmd = rl => {
  	rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
  		rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
  			model.add(question, answer);
  			log(` ${colorize ('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
  			rl.prompt();
  		});
  	});
  	};

/**
*Borra un quiz del modelo.
*
*	@param id Clave del quiz a borrar en el modelo.
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.deleteCmd = (rl, id) => {
  	if (typeof id === "undefined"){
		errorLog(`Falta el parámetro id.`);
	} else {
		try {
			model.deleteByIndex(id);
		} catch(error) {
			errorLog(error.message);
		}
	}
  	   rl.prompt();
  	};

/**
*Edita un quiz del modelo.
*
*	@param id Clave del quiz a borrar en el modelo.
*	@param rl Objeto readline usado para implementar el CLI.
*/
	exports.editCmd = (rl, id) => {
	  	   	if (typeof id === "undefined"){
			errorLog(`Falta el parámetro id.`);
			rl.prompt();
		} else {
			try {
				const quiz = model.getByIndex(id);
				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
				rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
					process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
	  				rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
	  					model.update(id, question, answer);
	  					log(` Se ha cambiado el quiz ${colorize (id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
	  					rl.prompt();
	  				});
	  			});
		} catch(error) {
				errorLog(error.message);
				rl.prompt();
		}
		}
	  	rl.prompt();
	  	};

/**
*Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
*
*	@param id Clave del quiz a probar.
*	@param rl Objeto readline usado para implementar el CLI.
*/
	exports.testCmd = (rl, id) => {
	  	if (typeof id === "undefined"){
			errorLog(`Falta el parámetro id.`);
			rl.prompt();
		} else {
			try {
				const quiz = model.getByIndex(id);
				rl.question(colorize(`${quiz.question}? `, 'red'), answer => {
					if((quiz.answer).trim().toLowerCase() === answer.trim().toLowerCase()){
						log('Su respuesta es correcta.')
						bigLog(' Correcta','green');
					} else {
						log('Su respuesta es incorrecta.')
						bigLog(' Incorrecta','red');
					}

	  			rl.prompt();
	  				});
	  			} catch(error) {
				errorLog(error.message);
				rl.prompt();}
			}
	  	rl.prompt();
	  	}; 

/**
*Pregunta todos los quizzes dexistentes en el modelo en orden aleatorio.
*Se gana si se contesta a todos satisfactoriamente.
*
*	@param rl Objeto readline usado para implementar el CLI.
*/
exports.playCmd = rl => {
  	  	let score = 0;
  	  	let toBeResolved = model.getAll();
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
						rl.question(colorize(`${quiz.question}? `, 'red'), answer => {
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
		  				} catch(error) {
							errorLog(error.message);
							rl.prompt();
	  	  				}
  	  			
  	  			}
  	  		}
  	  	}
  	  	playOne();
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
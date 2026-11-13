/**
 * Fábrica de controller CRUD (camada HTTP).
 * Lê a requisição, chama o service e devolve a resposta. Sem regra de negócio, sem SQL.
 * Erros lançados pelo service seguem para o middleware tratarErros.
 */
function criarControllerCrud(service) {
  return {
    listar: (req, res) => res.json(service.listar(req.usuarioId)),
    criar: (req, res) => res.status(201).json(service.criar(req.usuarioId, req.body)),
    atualizar: (req, res) => res.json(service.atualizar(req.usuarioId, req.params.id, req.body)),
    remover: (req, res) => res.json(service.remover(req.usuarioId, req.params.id)),
  };
}

/** Registra as 4 rotas padrão de um recurso em um Router. */
function registrarRotasCrud(router, caminho, controller, { semListagem = false } = {}) {
  if (!semListagem) router.get(caminho, controller.listar);
  router.post(caminho, controller.criar);
  router.put(`${caminho}/:id`, controller.atualizar);
  router.delete(`${caminho}/:id`, controller.remover);
  return router;
}

module.exports = { criarControllerCrud, registrarRotasCrud };

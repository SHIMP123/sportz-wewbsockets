import Router from 'express';

const matchRouter = Router();

matchRouter.get('/', (req, res) => {
    res.status(200).json({message: 'Matches list.'})
})

export default matchRouter;
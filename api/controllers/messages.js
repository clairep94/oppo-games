const Message = require("../models/message");
const TokenGenerator = require("../lib/token_generator");

const MessagesController = {
    AddMessage: async (req, res) => { 
        const newMessage = new Message({
            gameID: req.body.gameID,
            author: req.body.author,
            body: req.body.body
        });
        try {
            const result = await newMessage.save()
            const populatedMessage = await Message.populate(result, {
                path: 'author',
                select: '_id username', 
            });

            const token = TokenGenerator.jsonwebtoken(req.user_id) 
            res.status(201).json({ message: 'Successful New Message in Messages Controller', newMessage: result, token: token });

        } catch (error) {
            console.log('Error in Message Controller - AddMessage:', error);
            res.status(500).json(error);
        }
    },
    GetMessages: async (req, res) => { 
        const gameID = req.params.gameID;
        try {
            const messages = await Message.find(
                { gameID: gameID },
            )
            .populate({
                path: 'author',
                select: '_id username'})
            const token = TokenGenerator.jsonwebtoken(req.user_id) 
            res.status(200).json({ message: 'Successful All Messages in Messages Controller', allMessages: messages, token: token }); 

        } catch (error) {
            console.log('Error in Message Controller - GetMessages:', error);
            res.status(500).json(error);
        }
    },
}

module.exports = MessagesController
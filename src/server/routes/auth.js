export default async function (server) {
    server.post('/auth/login', async (req, res) => {

        const { user, pass } = req.body;
        let client = await server.getClient()
        await client.connect()
        const database = await client.db("fastifyVite");
        const users = database.collection("users");

        try {
            let doc = await users.findOne({'user': user})
            if (doc) {

                let check = await server.compareHash(pass,doc.pass)
                
                if (!!check) {
                    let payload = {
                        user: doc.user,
                        role: 'user'
                    }

                    // let token = await server.jwt.userAuto.sign({payload}, { expiresIn: '2h'});
                    // let refreshToken = await server.jwt.userRefresh.sign({payload},{ expiresIn: '15h'});
                    req.user.set('data', payload)
                    res.send('hello world')
                } else {
                    return (`Incorrect password`)
                }
            } else {
                return (`User: ${user} not found`)
            }
        } catch (error) {
            console.log(error)
        }
        finally {
            await client.close();
        }
    })
    server.post('/auth/register', async (req, res) => {
        console.log(await hash(req.body.pass))

        const { user, pass } = req.body;

        await client.connect()
        const database = client.db("fastifyVite");
        const users = database.collection("users");
        try {
            let doc = await users.findOne({'user': user})

            if(doc){
                return (`User ${user} alerdy exists`)
            }
            else {
                await users.insertOne({ user: user, pass: await hash(pass) } )
                console.log(`Usuario: ${user} adicionado`)
                return ('Registered successfully')
            }
        } catch (error) {
            console.log(error)
        } finally {
            await client.close();
        }
    })
}
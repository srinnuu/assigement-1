let express = require('express')
let {open} = require('sqlite')
let sqlite3 = require('sqlite3')
let path = require('path')
let bcrpt = require('bcrypt')
let jwt = require('jsonwebtoken')
let {format, compareAsc, isValid} = require('date-fns')

let exp = express()
exp.use(express.json())

let dbpath = path.join(__dirname, 'todoApplication.db')
let db = null

let main = async () => {
  try {
    db = await open({filename: dbpath, driver: sqlite3.Database})
    exp.listen(3000, () => {
      console.log('server runs at 3000')
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}
main()

exp.get('/todos/', async (request, response) => {
  let {category, priority, status, search_q = ''} = request.query
  let query = undefined
  switch (true) {
    case category === undefined &&
      priority === undefined &&
      status !== undefined &&
      search_q === '':
      status = status.replace('%20', ' ')
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        query = `select id,todo,category,priority,status,due_date as dueDate from todo where status='${status}'`
        let ans1 = await db.all(query)
        response.send(ans1)
      } else {
        response.status = 400
        response.send('Invalid Todo Status')
      }
      break
    case status === undefined &&
      priority === undefined &&
      category !== undefined &&
      search_q === '':
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        query = `select id,todo,category,priority,status,due_date as dueDate from todo where category='${category}'`
        let ans2 = await db.all(query)
        response.send(ans2)
      } else {
        response.status = 400
        response.send('Invalid Todo Category')
      }

      break
    case status === undefined &&
      priority !== undefined &&
      category === undefined &&
      search_q === '':
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        query = `select id,todo,category,priority,status,due_date as dueDate from todo where priority='${priority}'`
        let ans3 = await db.all(query)
        response.send(ans3)
      } else {
        response.status = 400
        response.send('Invalid Todo Priority')
      }
      break
    case status === undefined &&
      priority === undefined &&
      category === undefined &&
      search_q !== '':
      query = `select id,todo,category,priority,status,due_date as dueDate from todo where todo like '%${search_q}%'`
      let ans4 = await db.all(query)
      response.send(ans4)
      break
    case status !== undefined &&
      priority === undefined &&
      category !== undefined &&
      search_q === '':
      status = status.replace('%20', ' ')

      query = `select id,todo,category,priority,status,due_date as dueDate from todo where status = '${status}' and category= '${category}'`
      let ans5 = await db.all(query)
      response.send(ans5)
      break
    case status !== undefined &&
      priority !== undefined &&
      category === undefined &&
      search_q === '':
      status = status.replace('%20', ' ')
      query = `select id,todo,category,priority,status,due_date as dueDate from todo where status = '${status}' and priority= '${priority}'`
      let ans6 = await db.all(query)
      response.send(ans6)
      break
    case status === undefined &&
      priority !== undefined &&
      category !== undefined &&
      search_q === '':
      query = `select id,todo,category,priority,status,due_date as dueDate from todo where category = '${category}' and priority= '${priority}'`
      let ans7 = await db.all(query)
      response.send(ans7)
      break
  }
})

exp.get('/todos/:todoId/', async (request, response) => {
  let {todoId} = request.params
  let query = `select id,todo,category,priority,status,due_date as dueDate from todo where id = ${todoId}`
  let ans = await db.get(query)
  response.send(ans)
})
//date problem
exp.post('/todos/', async (request, response) => {
  let {id, todo, category, priority, status, dueDate} = request.body
  let date = format(new Date(dueDate), 'yyyy-MM-dd')
  let query = `insert into todo (id,todo,category,priority,status,due_date) values (${id},'${todo}','${category}','${priority}','${status}','${date}')`
  await db.run(query)
  response.send('Todo Successfully Added')
})

exp.put('/todos/:todoId/', async (request, response) => {
  let {todoId} = request.params
  let {category, priority, status, todo, dueDate} = request.body
  switch (true) {
    case status !== undefined:
      status = status.replace('%20', ' ')
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        let query = `update todo set status='${status}' where id = ${todoId}`
        await db.run(query)
        response.send('Status Updated')
      } else {
        response.status = 400
        response.send('Invalid Todo Status')
      }

      break
    case category !== undefined:
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        let query2 = `update todo set category='${category}' where id = ${todoId}`
        await db.run(query2)
        response.send('Category Updated')
      } else {
        response.status = 400
        response.send('Invalid Todo Category')
      }
      break
    case priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        let query3 = `update todo set priority='${priority}' where id = ${todoId}`
        await db.run(query3)
        response.send('Priority Updated')
      } else {
        response.status = 400
        response.send('Invalid Todo Priority')
      }
      break
    case todo !== undefined:
      let query4 = `update todo set todo='${todo}' where id = ${todoId}`
      await db.run(query4)
      response.send('Todo Updated')
      break
    case dueDate !== undefined:
      let date = format(new Date(dueDate), 'yyyy-MM-dd')
      if (isValid(new Date(date))) {
        let query5 = `update todo set due_date='${date}' where id = ${todoId}`
        await db.run(query5)
        response.send('Due Date Updated')
      } else {
        response.status = 400
        response.send('Invalid Due Date')
      }
      break
  }
})

exp.delete('/todos/:todoId/', async (request, response) => {
  let {todoId} = request.params
  let query = `delete from todo where id = ${todoId}`
  await db.run(query)
  response.send('Todo Deleted')
})

exp.get('/agenda/', async (request, response) => {
  let {date} = request.query
  let dates = format(new Date(date), 'yyyy-MM-dd')
  if (isValid(new Date(dates))) {
    let query = `select id,todo,category,priority,status,due_date as dueDate from todo where due_date='${dates}'`
    let ans = await db.all(query)
    response.send(ans)
  } else {
    response.status = 400
    response.send('Invalid Due Date')
  }
})

module.exports = exp

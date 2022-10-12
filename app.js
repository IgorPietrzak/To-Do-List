const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js")
const app = express();
const mongoose = require("mongoose");
const { getDate } = require("./date");
const day = date.getDate();

//SET UP APP
app.use(bodyParser.urlencoded({extended: true})); //bodyParser setup
app.use(express.static("public"));
let items = [];

app.set('view engine', 'ejs');

// MONGO DB SECTION
mongoose.connect('mongodb://localhost:27017/todolistDB');// connect to DB.

const itemSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("item", itemSchema);

const item1 = new Item({
    name: "Press + to add note"
});

const item2 = new Item({
    name: "<-- Press to delete note"
});

const defaultItems = [item1, item2];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

// GET REQUESTS
app.get("/", (req, res) => {
    Item.find((err, foundDocs) => {
        if (err) {
            console.log(err);
        } else {
            if (foundDocs.length === 0){
                Item.insertMany(defaultItems, (err) => {
                    if (err){
                        console.log(err);
                    } else {
                        console.log("added default items successfully");
                        res.redirect("/");
                    }
                }); 
            } else{
                res.render("list", {listName: getDate(), items: foundDocs});
            }
        }
    });
});

app.get("/:customListName", (req, res) => {
    const customListName = req.params.customListName;

    List.findOne({name: customListName}, (err, docs) => {
        if (err){
            console.log(err);
        } else {
            if (docs === null) {
                const customList = new List({
                    name: customListName,
                    items: defaultItems
                });
                customList.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", {listName: customListName, items: docs.items});
            } 
        }
    });
});

// POST REQUESTS
app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.button;
    const item = new Item({
        name: itemName
    });
    if (listName === getDate()) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, (err, foundList) => {
            if (!err) {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            } else {
                console.log(err);
            }
        });
    }
});


app.post("/delete", (req, res) => {
    const itemId = req.body.checkbox;
    const listName = req.body.hidden;
    if (listName === getDate()) {
        Item.findByIdAndRemove(itemId, (err) => {
            if (err) {
                console.log(err);
            }
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, (err, foundList) => { //$pull removes.
            if(!err) {
                res.redirect("/" + listName);
            } else {
                console.log(err);
            }
        });
    }
});


app.listen("3000", () => {
    console.log("Server live on port 3000");
})
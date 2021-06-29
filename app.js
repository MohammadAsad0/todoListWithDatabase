//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

mongoose.connect("mongodb+srv://<username>:<password>@cluster0.4uyeb.mongodb.net/todoListDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemShema = new mongoose.Schema ({
    name: String
});
const Item = mongoose.model("Item", itemShema);


const listShema = new mongoose.Schema ({
    name: String,
    items: [itemShema]
});
const List = new mongoose.model("List", listShema);


const first = new Item({
    name: "<-- Check to delete this item"
});
var flag = false;


app.get("/",function(req,res){

    Item.find({}, function(err, foundItems) {
       
        if (foundItems.length === 0 && !flag) {
            first.save(() => res.redirect('/'));
        } else {
            res.render("list", {title: "Today", newTodo: foundItems});
        }
        
    });

});

app.post("/",function(req,res){
    const item = req.body.newItem;
    const title = req.body.list;

    const newItem = new Item({
        name: item
    });

    if(title === "Today") {
        newItem.save(() => res.redirect('/'));
    } else {
        List.findOne({name: title}, function(err, found) {
            found.items.push(newItem);
            found.save(() => res.redirect('/' + title));
        });
    }
});


app.get("/:listType", function(req,res) {
    const listType = _.capitalize(req.params.listType);

    List.findOne({name: listType}, function (err, found) {
        if(!err) {
            if(!found) {
                const newList = List({
                    name: listType,
                    items: first
                });
                newList.save(() => res.redirect('/' + listType));
            } else {
                res.render("list", {title: found.name, newTodo: found.items});
            }
        }
    });
});


app.post("/delete", function(req,res){
    const idToDelete = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today") {
        Item.findByIdAndRemove(idToDelete, function(err) {
            if(err) {
                console.log(err);
            } else {
                flag = true;
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: idToDelete}}}, function(err, foundList){
            if (!err){
              res.redirect("/" + listName);
            }
          });
    }
});


app.listen(process.env.PORT || 3000,function(){
    console.log("Server running successfully");
});
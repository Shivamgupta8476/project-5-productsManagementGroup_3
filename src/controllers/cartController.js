const mongoose= require('mongoose');
const cartModel=require("../models/cartModel")
const productModel=require("../models/productModel")
const {userModel} = require("../Models/userModel")
const {  isValidBody, isValidObjectId} = require("../utilities/validation");



//********************************** POST /users/:userId/cart (Add to cart) *******************************************


const createCart=async function(req,res){
    try{
let userId=req.params.userId
const {productId,cartId,quantity}= req.body

if (!isValidObjectId(userId)){
return res.status(400).send({ status: false, message: "USER ID is Not Valid" });
}
if (!isValidBody(req.body)) {
 return res.status(400).send({ status: false, message: "Field can't not be empty.Please enter some details" });
}
// if (!isValidObjectId(productId)){
//     return res.status(400).send({ status: false, message: "PRODUCT ID is Not Valid" });
// }
// if (!isValidObjectId(cartId)){
//     return res.status(400).send({ status: false, message: "CART ID is Not Valid" });
// }


const findUserDetails = await userModel.findOne({ _id: userId })
if (!findUserDetails) {
  return res.status(404).send({ status: false, message: "USER Not Found" });
}
const findProductDetails = await productModel.findOne({ _id: productId ,isDeleted:false}).select({_id:0,price:1})
let price=findProductDetails.price

if (!findProductDetails) {
  return res.status(404).send({ status: false, message: "PRODUCT Not Found" });
}

if(quantity==0)return res.status(400).send({message:"Quantity should not be zer0"})
const findCart= await cartModel.findOne({ userId: userId })

console.log(price* quantity)

let product={
    productId:productId,
    quantity:quantity
}
if(findCart){

await cartModel.findOneAndUpdate({userId:userId},{$addToSet:{items:product},$inc: { totalPrice:price* quantity,totalItems: quantity }} ,{new:true})
}
//console.log(findCart)

let data={
    userId:userId ,
  items: [{
    productId:productId,
    quantity: quantity
  }],
  totalPrice:price* quantity,
  totalItems:quantity
}

if(!findCart){
let createdCart = await cartModel.create(data)
res.status(201).send({Msg:"Working",data:createdCart})
}
else {
    res.status(200).send({msg:findCart})
}

    }catch(err){
        res.send({message:err.message})
    }

}


//**************PUT /users/:userId/cart (Remove product / Reduce a product's quantity from the cart) *******************************************


const updateCart = async function (req, res) {

    const userId = req.params.userId;
    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Not a valid user id" })

    const requestBody = req.body;
    if (!isValidBody(requestBody)) return res.status(400).send({ status: false, message: "Input is required from user" })

    const { productId, removeProduct } = requestBody

    if (!productId) return res.status(400).send({ status: false, message: "Product id is required" })
    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Not a valid product id" })

    const getProduct = await productModel.findOne({ _id: productId, isDeleted: false })

    if (!getProduct) return res.status(404).send({ status: false, message: "No product exist" })

    const productPrice = getProduct.price;

    const getCart = await cartModel.findOne({ userId: userId })

    if (getCart) {

        const cartId = getCart._id;
        let totalItems = getCart.totalItems;
        let totalPrice = getCart.totalPrice;

        if (!getCart.items.length) return res.status(404).send({ status: true, message: "Cart is empty" })

        for (let i = 0; i < getCart.items.length; i++) {

            if (getCart.items[i].productId == productId) {

                let productQuantity = getCart.items[i].quantity;

                if (removeProduct == 0) {

                    if (productQuantity >= 1) {
                        totalItems = totalItems - productQuantity
                        totalPrice = totalPrice - (productQuantity * productPrice)

                        const updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId, quantity: productQuantity } }, $set: { totalPrice: totalPrice, totalItems: totalItems } }, { new: true })

                        return res.status(200).send({ status: true, message: "Successful", data: updateCart })
                    }
                    else {
                        return res.status(404).send({ status: true, message: "No product exist" })
                    }
                }
                else if (removeProduct == 1) {

                    if (productQuantity > 1) {

                        totalItems = totalItems - 1;
                        totalPrice = totalPrice - productPrice;

                        const updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $inc: { [`items.${i}.quantity`]: -1 }, $set: { totalPrice: totalPrice, totalItems: totalItems } }, { new: true })

                        return res.status(200).send({ status: true, message: "Succescful", data: updateCart })
                    }
                    else if (productQuantity == 1) {

                        totalItems = totalItems - 1;
                        totalPrice = totalPrice - productPrice;

                        const updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId, quantity: productQuantity } }, $set: { totalPrice: totalPrice, totalItems: totalItems } }, { new: true })

                        return res.status(200).send({ status: true, message: "Succescful", data: updateCart })
                    }
                }
                else if (removeProduct > 1 && removeProduct < 0) {

                    return res.status(400).send({ status: false, message: "Not a valid input" })
                }
                else if (!removeProduct) {

                    return res.status(400).send({ status: false, message: "No input to remove product" })
                }


            }

        }


    }

    else if (!getCart) return res.status(400).send({ status: false, message: "No cart exist" })

}



//************************************************ GET /users/:userId/cart *******************************************



const getCart = async function (req, res) {
    try {
     let userId = req.params.userId

     if(!isValidBody(userId)){
            return res.status(400).send({  status: false, message: "Please Provide User Id" });
        }

      if (!isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: "UserID is Not Valid" });
      }

      let checkUser = await userModel.findOne({ _id: userId })

      if (!checkUser) {
        return res.status(404).send({ status: false, message: " This User Does not exist" })
    }

    let checkCart = await cartModel.findOne({ userId: userId })

    if (!checkCart) {
        return res.status(404).send({ status: false, message: "Cart Not Exist With This User" })
    }
    return res.status(200).send({ status: false, message: "User Cart Details", data: checkCart })
}
catch (error) {
    return res.status(500).send({ status: false, message: error.message })
}

};



//*****************************************DELETE /users/:userId/cart *******************************************

const delCart = async (req, res) => {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "UserID is Not Valid" });
          }

        let checkUser = await userModel.findOne({ _id: userId })

        if (!checkUser) {
            return res.status(404).send({ status: false, message: "This User is Not Exist" })
        }

        let checkCart = await cartModel.findOne({ userId: userId ,isDeleted:false})

        if (!checkCart) {
            return res.status(404).send({ status: false, message: "Cart does Not Exist With This User" })
        }

        let deleteCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0 }, { new: true })

        return res.status(200).send({ status: false, message: "Cart Successfully Deleted", data: deleteCart })
    }

    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
};




module.exports = {createCart, updateCart,getCart,delCart }
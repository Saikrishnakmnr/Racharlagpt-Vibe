(()=>{
"use strict";
const A=window.RBA;
if(!A)return;
const {$,state:S,call,notice,format}=A;

const flows={
 pickup:{
  awaiting_confirmation:["accepted","cancelled"],
  accepted:["packed","ready","cancelled"],
  packed:["ready","cancelled"],
  ready:["completed","cancelled"],
  completed:[],cancelled:[]
 },
 delivery:{
  awaiting_confirmation:["accepted","cancelled"],
  accepted:["packed","cancelled"],
  packed:["ready","out_for_delivery","cancelled"],
  ready:["out_for_delivery","cancelled"],
  out_for_delivery:["completed","cancelled"],
  completed:[],cancelled:[]
 },
 appointment:{
  awaiting_confirmation:["accepted","cancelled"],
  accepted:["completed","cancelled"],
  completed:[],cancelled:[]
 }
};
const paymentChoices={cash_pickup:"Cash at pickup",cash_delivery:"Cash on delivery",upi:"Shop owner UPI",qr:"Shop owner QR",confirm:"Discuss with shop owner"};
const fulfilments={pickup:"Pickup at shop",delivery:"Home delivery",appointment:"Appointment / enquiry"};
const statusLabels={
 awaiting_confirmation:"Waiting for shop acceptance",
 accepted:"Accepted",
 packed:"Packed",
 ready:"Ready",
 out_for_delivery:"Out for delivery",
 completed:"Completed",
 cancelled:"Cancelled"
};
function label(status,fulfillment){
 if(status==="ready")return fulfillment==="pickup"?"Ready for pickup":"Ready for dispatch";
 if(status==="completed")return fulfillment==="pickup"?"Collected / completed":fulfillment==="appointment"?"Service completed":"Delivered / completed";
 return statusLabels[status]||String(status||"Unknown").replaceAll("_"," ");
}
const ref=o=>"BA-"+String(o.order_number).padStart(7,"0");
const phoneFor=o=>String(o.customer_phone||"").replace(/\D/g,"");
function whatsappUrl(o,message){
 const phone=phoneFor(o);
 return phone.length>=8&&phone.length<=15?"https://wa.me/"+phone+"?text="+encodeURIComponent(message):"";
}
function messageFor(o,newStatus){
 const shopName=S.shop?.name||"the shop",reference=ref(o),status=newStatus||o.status;
 const greeting="Hello "+o.customer_name+", this is "+shopName+".\nOrder: "+reference+"\n";
 let body;
 switch(status){
  case "accepted":body="Your order has been accepted. We will update you when it is ready.";break;
  case "packed":body="Your items are packed. We will update you about pickup or dispatch.";break;
  case "ready":body=o.fulfillment==="pickup"?"Your order is READY FOR PICKUP. Please visit the shop.": "Your order is ready for dispatch. We will confirm delivery details.";break;
  case "out_for_delivery":body="Your order is out for delivery. Please be available to receive it.";break;
  case "completed":body=o.fulfillment==="pickup"?"Your order has been collected and completed. Thank you!":o.fulfillment==="appointment"?"Your service or appointment is completed. Thank you!":"Your order has been delivered and completed. Thank you!";break;
  case "cancelled":body="Unfortunately, your order has been cancelled. If you already paid, please contact the shop to arrange a refund directly.";break;
  default:body="Your order status is: "+label(status,o.fulfillment)+".";
 }
 return greeting+body+"\nThank you!";
}
function startWhatsApp(o,message){
 const url=whatsappUrl(o,message);
 if(!url){notice("No valid customer WhatsApp number is saved for this order.");return}
 // WhatsApp links open a draft only. The owner must tap Send.
 location.assign(url);
}
async function load(){
 if(!S.session?.user){$("ordersStatus").textContent="Sign in to view orders";return}
 try{
  const r=await call("orders"),orders=r.orders||[];
  $("ordersStatus").textContent=orders.length+" recent order requests";
  $("ordersList").replaceChildren();
  for(const o of orders){
   const card=document.createElement("article");card.className="order-card";
   const p=document.createElement("p");
   p.textContent=ref(o)+" · "+o.customer_name+" · "+o.customer_phone+" · "+format(o.amount_paise/100);
   const placed=document.createElement("p");placed.className="muted";
   const when=new Date(o.created_at);
   placed.textContent=Number.isNaN(when.getTime())?"Order date unavailable":"Ordered: "+new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(when)+" IST";
   const details=document.createElement("p");details.className="muted";
   details.textContent="Fulfilment: "+(fulfilments[o.fulfillment]||o.fulfillment||"Not specified")+" · Payment choice: "+(paymentChoices[o.payment_method]||o.payment_method||"Not specified");
   const items=document.createElement("p");
   items.textContent=(o.items||[]).map(x=>x.name+" × "+x.qty).join(", ");
   const note=document.createElement("p");note.className="muted";note.hidden=!o.note;note.textContent=o.note?"Customer note: "+o.note:"";
   const status=document.createElement("p");
   status.textContent="Order: "+label(o.status,o.fulfillment)+" · Payment: "+(o.payment_status==="verified"?"Received (owner-confirmed)":o.payment_status==="unverified"?"Not verified by owner":o.payment_status||"Unknown")+(o.delivery_address?" · Address: "+o.delivery_address:"");
   card.append(p,placed,details,items,note,status);
   const history=document.createElement("details");
   history.style.cssText="margin:10px 0;padding:10px 12px;border:1px solid #dce9df;border-radius:9px;background:#f7fbf8";
   const summary=document.createElement("summary");
   summary.textContent="Order activity history"+(Array.isArray(o.history)&&o.history.length?" ("+o.history.length+" recent changes)":"");
   summary.style.cssText="cursor:pointer;font-weight:750";
   history.append(summary);
   const timeline=document.createElement("div");
   timeline.style.cssText="margin-top:10px;display:grid;gap:8px";
   const events=Array.isArray(o.history)?o.history:[];
   for(const e of events){
    const line=document.createElement("p");line.className="muted";line.style.margin="0";
    const d=new Date(e.at);
    const when=Number.isNaN(d.getTime())?"Date unknown":new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(d)+" IST";
    const eventLabel=e.kind==="created"?"Order request created":e.kind==="payment_status"?"Payment status: "+(e.to==="verified"?"Received (owner-confirmed)":String(e.to||"Unknown")):e.kind==="order_status"?"Order changed to: "+label(e.to,o.fulfillment):"Order activity";
    line.textContent=when+" — "+eventLabel;
    timeline.append(line);
   }
   if(!events.length){
    const fallback=document.createElement("p");fallback.className="muted";
    fallback.textContent="Status history is recorded for new changes. Earlier status changes cannot be reconstructed.";
    timeline.append(fallback);
   }
   history.append(timeline);
   card.append(history);
   const actions=document.createElement("div");actions.className="row";
   for(const to of flows[o.fulfillment]?.[o.status]||[]){
    const b=document.createElement("button");b.className="btn ghost";b.textContent=label(to,o.fulfillment);
    b.onclick=async()=>{
     if(to==="cancelled"&&o.payment_status==="verified"&&!confirm("This order is marked paid. Cancellation does NOT refund money. You must arrange any applicable refund with the customer directly. Continue cancelling?"))return;
     if(to==="completed"&&["cash_pickup","cash_delivery"].includes(o.payment_method)&&o.payment_status!=="verified"){
      notice("Cash payment has not been confirmed. Receive the cash first, use 'I have received the payment', then complete this order.");return;
     }
     const changed=await update(o.id,{status:to});
     if(!changed)return;
     if(whatsappUrl(o,"test")){
      if(confirm("Order updated to: "+label(to,o.fulfillment)+".\n\nWould you like to OPEN WhatsApp with an update for this customer? You must tap Send yourself.\n\nOK = Open WhatsApp | Cancel = Skip notification")){
       startWhatsApp(o,messageFor(o,to));
      }else notice("Order status saved. Customer was NOT notified. You can use Message customer on WhatsApp later.",true);
     }else notice("Order status saved. No valid customer number is available for WhatsApp.",true);
    };
    actions.append(b);
   }
   if(o.payment_status!=="verified"){
    const warning=document.createElement("p");warning.className="muted";
    warning.style.cssText="width:100%;padding:10px 12px;border:1px solid #e5c67a;border-radius:8px;background:#fff8e4;color:#654814";
    warning.textContent="Important: Vibe does NOT verify payments by your customers. Check money in your UPI, bank account or cash in hand first. Never confirm based on a screenshot or promise.";
    card.append(warning);
    const b=document.createElement("button");b.className="btn";b.textContent="I have received the payment";
    b.onclick=async()=>{
     if(!confirm("Have you personally received and verified the customer's payment?\n\nCheck the actual UPI / bank transaction or count the cash. Press OK only after real receipt."))return;
     const changed=await update(o.id,{payment_status:"verified"});
     if(changed)notice("Payment marked received. WhatsApp is not sent automatically; use Notify customer: payment received if you wish.",true);
    };
    actions.append(b);
   }
   if(whatsappUrl(o,"test")){
    if(o.payment_status==="verified"){
     const b=document.createElement("button");b.className="btn ghost";b.textContent="💬 Notify customer: payment received";
     b.onclick=()=>startWhatsApp(o,"Hello "+o.customer_name+", this is "+(S.shop?.name||"the shop")+". We confirm receiving payment for order "+ref(o)+" ("+format(o.amount_paise/100)+"). Order status: "+label(o.status,o.fulfillment)+". Thank you!");
     actions.append(b);
    }
    const contact=document.createElement("button");contact.className="btn ghost";contact.textContent="💬 Message customer on WhatsApp";
    contact.onclick=()=>startWhatsApp(o,messageFor(o,o.status));
    actions.append(contact);
   }
   if(o.status==="completed"||o.status==="cancelled"){
    const terminal=document.createElement("p");terminal.className="muted";
    terminal.textContent="This order is "+label(o.status,o.fulfillment)+". Changes to its fulfilment status are closed; the message button is still available.";
    card.append(terminal);
   }
   card.append(actions);$("ordersList").append(card);
  }
 }catch(e){$("ordersStatus").textContent="Cannot load orders: "+e.message}
}
async function update(id,change){
 try{await call("order_update",{id,...change});await load();notice("Order status updated.",true);return true}
 catch(e){notice(e.message);return false}
}
$("refreshOrders").onclick=load;
A.loadOrders=load;
})();

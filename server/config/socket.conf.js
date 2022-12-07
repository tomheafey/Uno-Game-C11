function socketConfig(io) {
  let hostuid;
  const startingRooms = ["game-1", "game-2", "game-3", "game-4"];
  let rooms = [
    { id: "game-1", isPrivate: false },
    { id: "game-2", isPrivate: false },
    { id: "game-3", isPrivate: false },
    { id: "game-4", isPrivate: false },
  ];
  io.on("connection", (socket) => {
    const { roomID, username, uid, isPrivate } = socket.handshake.query;
    let roomCount = parseInt(io.sockets.adapter.rooms.get(roomID)?.size);
    if (roomID) {
      socket.join(roomID);
      if (!rooms.some((room) => room.id === roomID)) {
        rooms.push({ id: roomID, isPrivate: isPrivate });
        io.emit("rooms", { rooms });
      }
    }
    io.to(socket.id).emit("host check", { roomCount, uid });
    if (!roomID) {
      io.to(socket.id).emit("rooms", { rooms });
    }
    io.to(roomID).emit("user connect", { username, uid });

    socket.on("new message", ({ body }) => {
      io.to(roomID).emit("new message", { username, body });
    });

    socket.on(
      "end turn",
      ({
        players,
        discardDeck,
        activeCard,
        newActiveCard,
        isReverse,
        turn,
        playDeck,
      }) => {
        io.to(roomID).emit("end turn", {
          players,
          discardDeck,
          activeCard,
          newActiveCard,
          isReverse,
          turn,
          playDeck,
        });
      }
    );

    socket.on("start game", ({ players, playDeck, activeCard }) => {
      io.to(roomID).emit("start game", { players, playDeck, activeCard });
    });

    socket.on("end game", ({ message }) => {
      io.to(roomID).emit("end game", { message });
    });

    socket.on("sendhostuid", (uid) => {
      hostuid = uid;
    });

    socket.on("disconnect", () => {
      if (hostuid == uid) {
        io.to(roomID).emit("host disconnected", {});
      }
      io.to(roomID).emit("user disconnect", { username, uid });
      if (roomID) {
        let roomCount = parseInt(io.sockets.adapter.rooms.get(roomID)?.size);
        if (isNaN(roomCount) && !startingRooms.includes(roomID)) {
          let newRooms = rooms.filter((room) => room.id !== roomID);
          io.emit("rooms", { newRooms });
        }
      }
    });

    socket.on("game active", (activeGame) => {
      io.socket.broadcast.to(roomID).emit("game active", activeGame);
    });

    socket.on(
      "draw card",
      ({
        players,
        playDeck,
        turn,
        draws,
        activeCard,
        discardDeck,
        isReverse,
      }) => {
        io.to(roomID).emit("draw card", {
          players,
          playDeck,
          turn,
          draws,
          activeCard,
          discardDeck,
          isReverse,
        });
      }
    );
  });
}
module.exports = socketConfig;
